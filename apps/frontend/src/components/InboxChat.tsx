'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface InboxChatProps {
  conversationId: string;
  platform?: string;
}

export default function InboxChat({ conversationId, platform = 'unknown' }: InboxChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const workspaceId = 'workspace-1'; // Hardcoded for demo

  useEffect(() => {
    // 1. Fetch historical messages
    fetch(`/api/v1/inbox/conversations/${conversationId}/messages`, {
      headers: { 'x-workspace-id': workspaceId }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error('Error fetching messages', err));

    // 2. Setup WebSocket for real-time updates
    const newSocket = io('http://localhost:3000/inbox'); // Assuming NestJS runs on 3000
    
    newSocket.on('connect', () => {
      console.log('Connected to Inbox WS');
      newSocket.emit('joinWorkspace', workspaceId);
    });

    newSocket.on('newMessage', (message: any) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => {
          // Avoid duplicates if we just sent it
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      const res = await fetch(`/api/v1/inbox/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId
        },
        body: JSON.stringify({ text: inputText, platform })
      });
      
      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setInputText('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center shadow-sm z-10">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
          {platform.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Conversation on {platform}</h3>
          <p className="text-xs text-green-600 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1 inline-block"></span>
            Live connection active
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.isOutbound ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.isOutbound 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              {!msg.isOutbound && (
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {msg.senderName}
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              <div className={`text-[10px] mt-1 text-right ${msg.isOutbound ? 'text-blue-100' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end bg-gray-50 rounded-xl border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden">
          <textarea
            className="flex-1 max-h-32 p-3 bg-transparent border-none focus:outline-none resize-none text-sm text-gray-800"
            placeholder="Type your reply..."
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={handleKeyPress}
          />
          <div className="p-2">
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2 flex justify-between px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Reply as Fluxora System</span>
        </div>
      </div>
    </div>
  );
}

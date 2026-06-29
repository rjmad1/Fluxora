'use client';

import React, { useState, useEffect } from 'react';
import InboxChat from '../../components/InboxChat';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    // Mock fetch for conversations
    fetch('/api/v1/inbox/conversations', {
      headers: {
        'x-workspace-id': 'workspace-1',
      }
    })
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        if (data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].id);
        }
      })
      .catch(err => console.error('Failed to load conversations', err));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Unified Inbox</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{conversations.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No conversations found.</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  activeConversationId === conv.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900">{conv.participantName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(conv.latestMessage?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 truncate mr-2 flex-1">
                    {conv.latestMessage?.isOutbound ? 'You: ' : ''}
                    {conv.latestMessage?.text}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    conv.platform === 'twitter' ? 'bg-blue-100 text-blue-700' :
                    conv.platform === 'linkedin' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {conv.platform}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeConversationId ? (
          <InboxChat 
            conversationId={activeConversationId} 
            platform={conversations.find(c => c.id === activeConversationId)?.platform}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-lg">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PostItem {
  id: string;
  title: string;
  content: string;
  time: string;
  day: string; // "Mon", "Tue", etc.
  date: number; // Day of month, e.g. 15, 16, 17
  channel: "linkedin" | "twitter" | "facebook" | "instagram" | "tiktok";
  author: string;
  status: "draft" | "scheduled" | "published" | "pending";
}

interface VisualCalendarProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

const mockAuthors = ["Sarah Jenkins (Admin)", "David Lee (Creator)", "Anna Koval (Manager)"];

export default function VisualCalendar({ onNotify }: VisualCalendarProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("All");
  
  // Post states
  const [posts, setPosts] = useState<PostItem[]>([
    { id: "cal-101", title: "Scale Telemetry Infrastructure", content: "We just decoupled our ingestion rates scaling up to 1.5s lag with ClickHouse! 🚀", time: "09:00", day: "Mon", date: 15, channel: "linkedin", author: "Sarah Jenkins (Admin)", status: "scheduled" },
    { id: "cal-102", title: "RLS Policies Architecture Check", content: "How do you manage tenant isolation in Postgres? We share our experience using Row-Level Security.", time: "14:30", day: "Tue", date: 16, channel: "twitter", author: "David Lee (Creator)", status: "scheduled" },
    { id: "cal-103", title: "Customer Success Story Highlight", content: "Celebrating a SaaS founder achieving 10M impressions on Fluxora. The journey is just beginning!", time: "11:00", day: "Wed", date: 17, channel: "facebook", author: "Anna Koval (Manager)", status: "draft" },
    { id: "cal-104", title: "Visual Canva Builder Launch", content: "Design graphics inside Fluxora! Here is a sneak peek at our draggable layers designer.", time: "16:00", day: "Thu", date: 18, channel: "instagram", author: "Sarah Jenkins (Admin)", status: "pending" },
    { id: "cal-105", title: "Why Telemetry Matters", content: "A deep dive thread on tracking clicks and views across 30+ networks automatically.", time: "10:00", day: "Fri", date: 19, channel: "twitter", author: "David Lee (Creator)", status: "scheduled" }
  ]);

  // Selected post for editing/previewing
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [previewPlatform, setPreviewPlatform] = useState<"linkedin" | "twitter" | "facebook" | "instagram">("linkedin");
  
  // Drag and drop states
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  // Filters
  const filteredPosts = posts.filter(post => {
    const platformMatch = selectedPlatform === "All" || post.channel === selectedPlatform.toLowerCase();
    const authorMatch = selectedAuthor === "All" || post.author === selectedAuthor;
    return platformMatch && authorMatch;
  });

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPostId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetDate: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedPostId;
    if (!id) return;

    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        onNotify(`Rescheduled "${p.title}" to ${targetDay} (June ${targetDate})`, "AUDIT");
        return { ...p, day: targetDay, date: targetDate };
      }
      return p;
    }));
    setDraggedPostId(null);
  };

  // Delete draft
  const handleDeletePost = (id: string) => {
    const postToDelete = posts.find(p => p.id === id);
    if (confirm(`Are you sure you want to delete this draft: "${postToDelete?.title}"?`)) {
      setPosts(prev => prev.filter(p => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
      onNotify(`Deleted post draft "${postToDelete?.title}"`, "WARN");
    }
  };

  // Save edits
  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    setPosts(prev => prev.map(p => p.id === selectedPost.id ? selectedPost : p));
    setIsEditing(false);
    onNotify(`Updated details for "${selectedPost.title}"`, "INFO");
  };

  // Week View Days Configuration
  const weekDays = [
    { dayName: "Mon", date: 15 },
    { dayName: "Tue", date: 16 },
    { dayName: "Wed", date: 17 },
    { dayName: "Thu", date: 18 },
    { dayName: "Fri", date: 19 },
    { dayName: "Sat", date: 20 },
    { dayName: "Sun", date: 21 },
  ];

  // Month View Calendar Grid (June 2026)
  const monthDays = Array.from({ length: 30 }, (_, i) => {
    const dateNum = i + 1;
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    // June 1, 2026 is a Monday
    const dayName = dayNames[i % 7];
    return { date: dateNum, dayName };
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121218] border border-white/[0.08] p-5 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-[#0B0B0F] border border-white/[0.08] p-1 rounded-xl flex gap-1">
            {(["month", "week", "day"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  viewMode === mode ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1.5 bg-[#0B0B0F] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[#A1A1AA]">Platform:</span>
            <select
              value={selectedPlatform}
              onChange={e => setSelectedPlatform(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="All">All Networks</option>
              <option value="Linkedin">LinkedIn</option>
              <option value="Twitter">Twitter / X</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Tiktok">TikTok</option>
            </select>
          </div>

          {/* Author Filter */}
          <div className="flex items-center gap-1.5 bg-[#0B0B0F] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[#A1A1AA]">Author:</span>
            <select
              value={selectedAuthor}
              onChange={e => setSelectedAuthor(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="All">All Authors</option>
              {mockAuthors.map(author => (
                <option key={author} value={author}>{author.split(" ")[0]}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            const newId = `cal-${Date.now()}`;
            const newPost: PostItem = {
              id: newId,
              title: "New Post Draft",
              content: "Drafting a new campaign update. Click to edit content...",
              time: "09:00",
              day: "Mon",
              date: 15,
              channel: "linkedin",
              author: "Sarah Jenkins (Admin)",
              status: "draft"
            };
            setPosts(prev => [...prev, newPost]);
            setSelectedPost(newPost);
            setIsEditing(true);
            onNotify("Created a new content calendar draft", "INFO");
          }}
          className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>Schedule Post</span>
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Body */}
        <div className="lg:col-span-3 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl min-h-[500px]">
          {/* Week Grid View */}
          {viewMode === "week" && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-3 text-center border-b border-white/[0.08] pb-4">
                {weekDays.map(d => (
                  <div key={d.dayName} className="space-y-1">
                    <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block">{d.dayName}</span>
                    <span className="text-sm font-extrabold text-white bg-[#0B0B0F] border border-white/[0.04] w-7 h-7 flex items-center justify-center rounded-full mx-auto">
                      {d.date}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3 min-h-[400px]">
                {weekDays.map(d => {
                  const dayItems = filteredPosts.filter(p => p.date === d.date);
                  return (
                    <div
                      key={d.dayName}
                      onDragOver={handleDragOver}
                      onDrop={e => handleDrop(e, d.dayName, d.date)}
                      className="bg-[#0B0B0F]/40 border border-white/[0.04] rounded-xl p-2 space-y-2 min-h-[150px] transition-all hover:border-[#7C3AED]/20"
                    >
                      {dayItems.map(item => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={e => handleDragStart(e, item.id)}
                          onClick={() => {
                            setSelectedPost(item);
                            setIsEditing(false);
                            // Auto-set matching preview tab
                            if (item.channel === "tiktok") {
                              setPreviewPlatform("instagram");
                            } else {
                              setPreviewPlatform(item.channel as any);
                            }
                          }}
                          className={`p-2 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all hover:brightness-110 ${
                            item.channel === "linkedin"
                              ? "bg-blue-900/10 border-blue-800/20 text-blue-400"
                              : item.channel === "twitter"
                              ? "bg-sky-900/10 border-sky-850/20 text-sky-400"
                              : item.channel === "instagram"
                              ? "bg-pink-900/10 border-pink-850/20 text-pink-400"
                              : "bg-indigo-900/10 border-indigo-850/20 text-indigo-400"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[8px] font-mono mb-1 uppercase font-semibold">
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.status === "scheduled" ? "bg-emerald-500" : item.status === "draft" ? "bg-amber-500" : "bg-blue-500"
                              }`} />
                              {item.channel}
                            </span>
                            <span>{item.time}</span>
                          </div>
                          <h4 className="text-[10px] leading-tight font-bold truncate">{item.title}</h4>
                        </div>
                      ))}
                      {dayItems.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[10px] text-white/5 select-none py-10">
                          + Drop here
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Month Grid View */}
          {viewMode === "month" && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center border-b border-white/[0.08] pb-3 text-xs font-bold text-[#A1A1AA] uppercase">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map(d => {
                  const dayItems = filteredPosts.filter(p => p.date === d.date);
                  return (
                    <div
                      key={d.date}
                      onDragOver={handleDragOver}
                      onDrop={e => handleDrop(e, d.dayName, d.date)}
                      className="bg-[#0B0B0F]/30 border border-white/[0.04] p-1.5 rounded-lg min-h-[80px] flex flex-col justify-between hover:border-[#7C3AED]/20 transition"
                    >
                      <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] font-mono">
                        <span>{d.date}</span>
                      </div>
                      <div className="space-y-1 my-1 flex-1 overflow-hidden">
                        {dayItems.map(item => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={e => handleDragStart(e, item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPost(item);
                              setIsEditing(false);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-semibold truncate cursor-pointer ${
                              item.channel === "linkedin"
                                ? "bg-blue-900/20 text-blue-400 border border-blue-800/10"
                                : item.channel === "twitter"
                                ? "bg-sky-900/20 text-sky-400 border border-sky-850/10"
                                : "bg-purple-900/20 text-purple-400 border border-purple-850/10"
                            }`}
                          >
                            {item.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day Grid View */}
          {viewMode === "day" && (
            <div className="space-y-4">
              <div className="border-b border-white/[0.08] pb-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Daily Dispatch Agenda (June 15, 2026)</h3>
                <span className="text-[10px] bg-[#7C3AED]/10 text-[#8B5CF6] border border-[#7C3AED]/20 px-2 py-0.5 rounded-full font-bold">Today</span>
              </div>
              <div className="space-y-3">
                {["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"].map(hour => {
                  const hourItems = filteredPosts.filter(p => p.time.startsWith(hour.slice(0, 2)) && p.date === 15);
                  return (
                    <div key={hour} className="flex gap-4 items-center bg-[#0B0B0F]/20 p-2 border border-white/[0.03] rounded-xl">
                      <span className="text-xs font-mono text-[#A1A1AA] w-12">{hour}</span>
                      <div className="flex-1 flex gap-2">
                        {hourItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedPost(item);
                              setIsEditing(false);
                            }}
                            className="p-3 bg-[#0B0B0F] border border-white/[0.08] hover:border-[#7C3AED]/30 rounded-xl cursor-pointer flex-1 flex justify-between items-center transition"
                          >
                            <div>
                              <h5 className="text-xs font-bold text-white">{item.title}</h5>
                              <p className="text-[10px] text-[#A1A1AA] mt-0.5 truncate max-w-md">{item.content}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] uppercase tracking-wider text-[#A1A1AA] font-mono">{item.author.split(" ")[0]}</span>
                              <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                item.channel === "linkedin" ? "bg-blue-500/10 text-blue-400" : "bg-sky-500/10 text-sky-400"
                              }`}>{item.channel}</span>
                            </div>
                          </div>
                        ))}
                        {hourItems.length === 0 && (
                          <span className="text-[10px] text-white/5 italic py-1">No scheduled broadcasts</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Real-time Previewer & Editor Sidebar */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedPost ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.Sliders className="w-4 h-4 text-[#8B5CF6]" />
                    {isEditing ? "Edit Draft Details" : "Selected Details"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1 hover:bg-white/[0.04] text-[#A1A1AA] hover:text-white rounded-lg transition cursor-pointer"
                      title="Edit / View Toggle"
                    >
                      {isEditing ? <Icons.Eye className="w-4 h-4" /> : <Icons.Edit className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeletePost(selectedPost.id)}
                      className="p-1 hover:bg-[#EF4444]/10 text-[#A1A1AA] hover:text-[#EF4444] rounded-lg transition cursor-pointer"
                      title="Delete Draft"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  /* Editing Mode Form */
                  <form onSubmit={handleSavePost} className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase text-[#A1A1AA] font-bold block mb-1">Title</label>
                      <input
                        type="text"
                        value={selectedPost.title}
                        onChange={e => setSelectedPost({ ...selectedPost, title: e.target.value })}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#A1A1AA] font-bold block mb-1">Content</label>
                      <textarea
                        value={selectedPost.content}
                        onChange={e => setSelectedPost({ ...selectedPost, content: e.target.value })}
                        className="w-full h-24 bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase text-[#A1A1AA] font-bold block mb-1">Time</label>
                        <input
                          type="text"
                          value={selectedPost.time}
                          onChange={e => setSelectedPost({ ...selectedPost, time: e.target.value })}
                          className="w-full bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-[#A1A1AA] font-bold block mb-1">Author</label>
                        <select
                          value={selectedPost.author}
                          onChange={e => setSelectedPost({ ...selectedPost, author: e.target.value })}
                          className="w-full bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          {mockAuthors.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold py-2 rounded-xl mt-3 transition cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </form>
                ) : (
                  /* Live Previewer Panel */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-[#A1A1AA]">
                        <span>Author:</span>
                        <strong className="text-white">{selectedPost.author}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs text-[#A1A1AA]">
                        <span>Scheduled:</span>
                        <strong className="text-white">{selectedPost.day} (June {selectedPost.date}) at {selectedPost.time}</strong>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.08] pt-4">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Platform Preview</h4>
                      <div className="flex gap-1 mb-3 bg-[#0B0B0F] p-1 border border-white/[0.08] rounded-lg">
                        {(["linkedin", "twitter", "facebook", "instagram"] as const).map(plat => (
                          <button
                            key={plat}
                            onClick={() => setPreviewPlatform(plat)}
                            className={`flex-1 text-[9px] font-semibold py-1 rounded capitalize transition cursor-pointer ${
                              previewPlatform === plat ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                            }`}
                          >
                            {plat === "twitter" ? "X" : plat}
                          </button>
                        ))}
                      </div>

                      {/* Mock Social Frame */}
                      <div className="bg-[#0B0B0F] border border-white/[0.08] p-3 rounded-xl min-h-[140px] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7C3AED] to-pink-500 flex items-center justify-center font-bold text-[9px] text-white">
                              FL
                            </div>
                            <div>
                              <h5 className="text-[10px] font-bold text-white">
                                {previewPlatform === "linkedin" ? "Sarah Jenkins (Fluxora Agency)" : previewPlatform === "twitter" ? "@FluxoraApp" : "Fluxora Marketing"}
                              </h5>
                              <p className="text-[8px] text-[#A1A1AA] font-mono">
                                {previewPlatform === "linkedin" ? "Sponsored • Professional Edition" : "Just now"}
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-white leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/[0.04] pt-2 mt-2 text-[9px] text-[#A1A1AA]">
                          <span>💬 4 comments</span>
                          <span>❤️ 42 likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-[#121218]/40 border border-white/[0.08] border-dashed rounded-2xl p-6 text-center text-xs text-[#A1A1AA] py-16">
                💡 Click any calendar slot or draft post to edit details and view live previews.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

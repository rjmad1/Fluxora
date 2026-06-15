"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlatformToggleConsoleProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

interface ThreadSegment {
  id: string;
  text: string;
}

interface CarouselSlide {
  id: string;
  title: string;
  image: string;
}

export default function PlatformToggleConsole({ onNotify }: PlatformToggleConsoleProps) {
  const [activeTab, setActiveTab] = useState<"twitter" | "linkedin" | "youtube">("twitter");

  // Twitter/X State
  const [threadSegments, setThreadSegments] = useState<ThreadSegment[]>([
    { id: "ts-1", text: "1/3 Securing data boundaries in a multi-tenant PostgreSQL system is crucial. Standard relational models struggle with high-volume telemetry indexing." },
    { id: "ts-2", text: "2/3 By decoupling Postgres and streaming post-engagement event pipelines via Kafka to ClickHouse, we ensure query aggregations complete in <500ms." },
    { id: "ts-3", text: "3/3 Row-Level Security (RLS) filters remain strictly enforced on all queries, guaranteeing complete isolation of workspace telemetry. Check out our plan!" }
  ]);
  const [twitterFirstComment, setTwitterFirstComment] = useState("#scaling #kafka #clickhouse #database #observability #datamodeling");
  const [enableTwitterFirstComment, setEnableTwitterFirstComment] = useState(true);

  // LinkedIn Carousel State
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([
    { id: "cs-1", title: "Scale Your Analytics Pipeline", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80" },
    { id: "cs-2", title: "Stream Events via Kafka", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=150&q=80" },
    { id: "cs-3", title: "Store telemetry in ClickHouse", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=150&q=80" }
  ]);
  const [linkedinGeo, setLinkedinGeo] = useState("United States, Germany, United Kingdom");
  const [linkedinAge, setLinkedinAge] = useState("25-54");
  const [enableGeoTargeting, setEnableGeoTargeting] = useState(false);
  const [linkedinFirstComment, setLinkedinFirstComment] = useState("Read the full engineering design documentation here: https://fluxora.dev/observability-scaling");
  const [enableLinkedinFirstComment, setEnableLinkedinFirstComment] = useState(true);

  // YouTube State
  const [videoCategory, setVideoCategory] = useState("Science & Technology");
  const [youtubePlaylist, setYoutubePlaylist] = useState("Tutorials");
  const [youtubeMadeForKids, setYoutubeMadeForKids] = useState("no");

  // Thread handlers
  const handleAddThreadSegment = () => {
    if (threadSegments.length >= 8) {
      onNotify("Platform Console: Limit of 8 thread segments reached", "WARN");
      return;
    }
    const num = threadSegments.length + 1;
    const newSeg: ThreadSegment = {
      id: `ts-${Date.now()}`,
      text: `${num}/${num} `
    };
    setThreadSegments([...threadSegments, newSeg]);
    onNotify("Platform Console: Appended new thread segment block", "INFO");
  };

  const handleRemoveThreadSegment = (id: string) => {
    if (threadSegments.length <= 1) return;
    setThreadSegments(threadSegments.filter(s => s.id !== id));
    onNotify("Platform Console: Removed thread segment block", "INFO");
  };

  const handleThreadTextChange = (id: string, text: string) => {
    setThreadSegments(prev => prev.map(s => s.id === id ? { ...s, text } : s));
  };

  // Carousel Re-ordering
  const moveSlide = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= carouselSlides.length) return;

    const updated = [...carouselSlides];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCarouselSlides(updated);
    onNotify(`Platform Console: Reordered slide ${index + 1} to index ${targetIdx + 1}`, "INFO");
  };

  const handleAddSlide = () => {
    const newSlide: CarouselSlide = {
      id: `cs-${Date.now()}`,
      title: "New Custom Slide Content",
      image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=150&q=80"
    };
    setCarouselSlides([...carouselSlides, newSlide]);
    onNotify("Platform Console: Created new carousel slide", "INFO");
  };

  const handleUpdateSlideTitle = (id: string, title: string) => {
    setCarouselSlides(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.08] pb-4 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Sliders className="w-5 h-5 text-[#8B5CF6]" />
            Platform-Specific Feature Toggle Console
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Configure advanced platform API metadata: Twitter threads, LinkedIn carousels, and YouTube playlists.</p>
        </div>

        {/* Platform selection sub tabs */}
        <div className="flex bg-[#0B0B0F]/80 border border-white/[0.08] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("twitter")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeTab === "twitter" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <span>Twitter / X</span>
          </button>
          <button
            onClick={() => setActiveTab("linkedin")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeTab === "linkedin" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <span>LinkedIn Feed</span>
          </button>
          <button
            onClick={() => setActiveTab("youtube")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeTab === "youtube" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <span>YouTube / Video</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Twitter/X Console tab */}
        {activeTab === "twitter" && (
          <motion.div
            key="twitter"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Col: Long-form Thread builder */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">
                  Custom Thread-Continuation Composer
                </label>
                <button
                  onClick={handleAddThreadSegment}
                  className="bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg border border-[#7C3AED]/30 flex items-center gap-1 transition cursor-pointer"
                >
                  <Icons.Plus className="w-3 h-3 text-[#8B5CF6]" />
                  <span>Add Continuation Tweet</span>
                </button>
              </div>

              {/* Thread list */}
              <div className="space-y-4 relative pl-5">
                {/* Visual Connector vertical line */}
                <div className="absolute left-2.5 top-5 bottom-5 w-0.5 bg-white/[0.05]" />

                {threadSegments.map((seg, idx) => (
                  <div key={seg.id} className="relative space-y-1">
                    {/* Circle Node */}
                    <div className="absolute -left-[23px] top-3.5 w-2 h-2 rounded-full bg-[#8B5CF6] border-2 border-[#121218]" />
                    
                    <div className="flex justify-between text-[9px] text-[#A1A1AA] font-mono pl-1">
                      <span>Post Segment #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className={seg.text.length > 280 ? "text-red-500 font-bold" : "text-[#A1A1AA]/60"}>
                          {seg.text.length} / 280 chars
                        </span>
                        {threadSegments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveThreadSegment(seg.id)}
                            className="text-red-400 hover:text-red-500 underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={seg.text}
                      onChange={e => handleThreadTextChange(seg.id, e.target.value)}
                      placeholder="Write your tweet continuation here..."
                      className="w-full h-20 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: First comment settings */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#0B0B0F]/35 border border-white/[0.05] p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">
                    First-Comment Automation
                  </h4>
                  <button
                    onClick={() => {
                      setEnableTwitterFirstComment(!enableTwitterFirstComment);
                      onNotify(`Platform Console: First-comment automation toggled ${!enableTwitterFirstComment ? "ON" : "OFF"}`, "INFO");
                    }}
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      enableTwitterFirstComment ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        enableTwitterFirstComment ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                
                <p className="text-[9px] text-[#A1A1AA]/70 leading-relaxed">
                  Automatically publish hashtags or URLs in the first comment block, keeping Twitter's algorithmic main post clean from downstream backlinks.
                </p>

                {enableTwitterFirstComment && (
                  <div className="space-y-1.5">
                    <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block">First Comment Text</label>
                    <textarea
                      value={twitterFirstComment}
                      onChange={e => setTwitterFirstComment(e.target.value)}
                      placeholder="Insert tags, links or supplementary text..."
                      className="w-full h-28 bg-[#121218] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* LinkedIn Console Tab */}
        {activeTab === "linkedin" && (
          <motion.div
            key="linkedin"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Col: Interactive Carousel Creator */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">
                  Interactive Carousel Post Slide Order Handler
                </label>
                <button
                  onClick={handleAddSlide}
                  className="bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg border border-[#7C3AED]/30 flex items-center gap-1 transition cursor-pointer"
                >
                  <Icons.Plus className="w-3 h-3 text-[#8B5CF6]" />
                  <span>Add Slide</span>
                </button>
              </div>

              {/* Slide list display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {carouselSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3.5 space-y-3 relative group"
                  >
                    <div className="h-24 bg-[#121218] rounded-lg overflow-hidden relative border border-white/[0.04]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.image}
                        alt="Slide cover"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 text-[8px] bg-black/60 px-1.5 py-0.2 rounded text-[#A1A1AA]">
                        Slide #{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block">Headline</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={e => handleUpdateSlideTitle(slide.id, e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-white text-[10px] rounded px-2 py-1 focus:outline-none"
                      />
                    </div>

                    {/* Re-order buttons */}
                    <div className="flex gap-1 justify-between pt-1 border-t border-white/[0.04]">
                      <button
                        onClick={() => moveSlide(idx, "left")}
                        disabled={idx === 0}
                        className="text-[8px] text-[#A1A1AA] hover:text-white disabled:opacity-30 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Icons.ChevronLeft className="w-3 h-3" />
                        <span>Move Left</span>
                      </button>
                      <button
                        onClick={() => moveSlide(idx, "right")}
                        disabled={idx === carouselSlides.length - 1}
                        className="text-[8px] text-[#A1A1AA] hover:text-white disabled:opacity-30 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Move Right</span>
                        <Icons.ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Target Audiences & First Comment */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Audience Targeting */}
              <div className="bg-[#0B0B0F]/35 border border-white/[0.05] p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Audience Targeting & Geo-Restriction
                  </h4>
                  <button
                    onClick={() => {
                      setEnableGeoTargeting(!enableGeoTargeting);
                      onNotify(`Platform Console: Audience targeting toggled ${!enableGeoTargeting ? "ON" : "OFF"}`, "INFO");
                    }}
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      enableGeoTargeting ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        enableGeoTargeting ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {enableGeoTargeting ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] uppercase text-[#A1A1AA] block mb-1 font-bold">Target Countries</label>
                      <input
                        type="text"
                        value={linkedinGeo}
                        onChange={e => setLinkedinGeo(e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] uppercase text-[#A1A1AA] block mb-1 font-bold">Age bracket limit</label>
                      <select
                        value={linkedinAge}
                        onChange={e => setLinkedinAge(e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="All">All age targets</option>
                        <option value="18-24">18 - 24 years</option>
                        <option value="25-54">25 - 54 years</option>
                        <option value="55+">55+ years</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-[#A1A1AA]/50 leading-relaxed italic text-center py-2 border border-dashed border-white/[0.05] rounded-xl">
                    Dynamic restrictions inactive. Posting globally.
                  </p>
                )}
              </div>

              {/* First Comment */}
              <div className="bg-[#0B0B0F]/35 border border-white/[0.05] p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-white/[0.08] pb-2">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">
                    LinkedIn First-Comment
                  </h4>
                  <button
                    onClick={() => setEnableLinkedinFirstComment(!enableLinkedinFirstComment)}
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      enableLinkedinFirstComment ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        enableLinkedinFirstComment ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {enableLinkedinFirstComment && (
                  <textarea
                    value={linkedinFirstComment}
                    onChange={e => setLinkedinFirstComment(e.target.value)}
                    className="w-full h-16 bg-[#121218] border border-white/[0.08] rounded-lg p-2.5 text-[10px] text-white focus:outline-none resize-none"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* YouTube / Video Console Tab */}
        {activeTab === "youtube" && (
          <motion.div
            key="youtube"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 max-w-xl mx-auto bg-[#0B0B0F]/45 border border-white/[0.05] p-6 rounded-2xl"
          >
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-3">
              YouTube Video Ingestion Metadata & Channel Mappings
            </h4>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block mb-1">
                    YouTube Category Mapping Selector
                  </label>
                  <select
                    value={videoCategory}
                    onChange={e => {
                      setVideoCategory(e.target.value);
                      onNotify(`Platform Console: Mapped video category to "${e.target.value}"`, "INFO");
                    }}
                    className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="Education">Education</option>
                    <option value="Howto & Style">Howto & Style</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block mb-1">Target Playlist Mapping</label>
                  <select
                    value={youtubePlaylist}
                    onChange={e => setYoutubePlaylist(e.target.value)}
                    className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Tutorials">Tutorials Playlist</option>
                    <option value="Release Notes">Release Notes</option>
                    <option value="Demos">Interactive Demos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block mb-1">Audience Restriction (COPPA Compliance)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                    <input
                      type="radio"
                      name="kids"
                      value="yes"
                      checked={youtubeMadeForKids === "yes"}
                      onChange={e => setYoutubeMadeForKids(e.target.value)}
                      className="accent-[#8B5CF6] cursor-pointer"
                    />
                    Yes, it is made for kids
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                    <input
                      type="radio"
                      name="kids"
                      value="no"
                      checked={youtubeMadeForKids === "no"}
                      onChange={e => setYoutubeMadeForKids(e.target.value)}
                      className="accent-[#8B5CF6] cursor-pointer"
                    />
                    No, it is not made for kids
                  </label>
                </div>
              </div>
            </div>
            
            <p className="text-[8px] text-[#A1A1AA]/50 border-t border-white/[0.04] pt-3 leading-relaxed font-mono">
              YouTube integration maps directly to OAuth scopes under the current Workspace A developer context.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

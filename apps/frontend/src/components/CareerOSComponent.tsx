"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";

interface CareerOSComponentProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function CareerOSComponent({ onNotify }: CareerOSComponentProps) {
  const [skills, setSkills] = useState([
    { id: 1, name: "NestJS / Nest Node.js", level: "Expert", category: "Backend" },
    { id: 2, name: "ClickHouse OLAP Ingestion", level: "Intermediate", category: "Data Engineering" },
    { id: 3, name: "Temporal Workflow Orchestration", level: "Expert", category: "Distributed Systems" },
    { id: 4, name: "Prisma & PostgreSQL RLS", level: "Advanced", category: "Backend" },
    { id: 5, name: "Apache Kafka Streaming", level: "Advanced", category: "Infrastructure" },
  ]);

  const [certifications, setCertifications] = useState([
    { id: 1, name: "Temporal Certified Developer", status: "Active", date: "2026-04-12" },
    { id: 2, name: "AWS Certified Solutions Architect", status: "Active", date: "2025-08-30" },
    { id: 3, name: "ClickHouse Certified Analyst", status: "In Progress", date: "Target: Q3 2026" },
  ]);

  const [goals, setGoals] = useState([
    { id: 1, title: "Achieve ClickHouse Ingestion benchmarks", status: "Completed" },
    { id: 2, title: "Establish Personal Brand as distributed systems voice", status: "Active" },
    { id: 3, title: "Complete Advanced LangGraph agent training", status: "Active" },
  ]);

  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("Intermediate");
  const [newSkillCat, setNewSkillCat] = useState("Backend");

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setSkills([...skills, { id: Date.now(), name: newSkill, level: newSkillLevel, category: newSkillCat }]);
    setNewSkill("");
    onNotify(`Added skill "${newSkill}" to Career OS mapping.`, "INFO");
  };

  return (
    <div className="space-y-6">
      {/* Upper Grid: Skills and Certs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Skills Competency */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Icons.Layers className="w-4.5 h-4.5 text-[#8B5CF6]" />
            Skills Competency Matrix
          </h3>

          <div className="space-y-3">
            {skills.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl hover:border-white/[0.08]"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{s.name}</h4>
                  <p className="text-[9px] text-[#A1A1AA] mt-0.5">{s.category}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  s.level === "Expert" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  s.level === "Advanced" ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20" :
                  "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {s.level}
                </span>
              </div>
            ))}
          </div>

          {/* Add Skill */}
          <div className="pt-4 border-t border-white/[0.04] flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="New skill name..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 min-w-[120px] bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              className="bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2 cursor-pointer"
            >
              <option value="Expert">Expert</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
            </select>
            <button
              onClick={handleAddSkill}
              className="bg-[#181821] hover:bg-white/[0.04] border border-white/[0.08] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Certifications Tracker */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Icons.Award className="w-4.5 h-4.5 text-[#8B5CF6]" />
            Certification Vault
          </h3>

          <div className="space-y-3">
            {certifications.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{c.name}</h4>
                  <p className="text-[9px] text-[#A1A1AA] mt-0.5">{c.date}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  c.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 animate-pulse"
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Career Milestones */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Icons.Compass className="w-4.5 h-4.5 text-[#8B5CF6]" />
          Strategic Milestones & Growth Goals
        </h3>

        <div className="space-y-3">
          {goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between p-3 bg-[#0B0B0F]/45 border border-white/[0.04] rounded-xl hover:border-white/[0.08]"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${g.status === "Completed" ? "bg-green-500/10 text-green-400" : "bg-[#7C3AED]/10 text-[#8B5CF6]"}`}>
                  {g.status === "Completed" ? <Icons.Check className="w-3.5 h-3.5" /> : <Icons.Target className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs font-medium ${g.status === "Completed" ? "text-[#A1A1AA] line-through" : "text-white"}`}>
                  {g.title}
                </span>
              </div>
              <span className="text-[9px] text-[#A1A1AA]/60 font-mono">{g.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

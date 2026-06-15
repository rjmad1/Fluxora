"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClientBrand {
  id: string;
  name: string;
  client: string;
  region: string;
  timezone: string;
  activeProfilesCount: number;
}

interface AssetFolder {
  id: string;
  name: string;
  path: string;
  size: string;
  filesCount: number;
}

interface ProfileBundle {
  id: string;
  name: string;
  platforms: string[];
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Editor" | "Billing Control";
  workspaceAccess: string;
}

interface BrandWorkspaceManagerProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
  activeWorkspaceName?: string;
  onWorkspaceChange?: (name: string) => void;
}

export default function BrandWorkspaceManager({
  onNotify,
  activeWorkspaceName = "Workspace A (Brand Operations)",
  onWorkspaceChange,
}: BrandWorkspaceManagerProps) {
  // Clients and workspaces context switcher data
  const [brands, setBrands] = useState<ClientBrand[]>([
    { id: "ws-1", name: "Workspace A (Brand Operations)", client: "Acme Corporate", region: "US-East", timezone: "America/New_York", activeProfilesCount: 3 },
    { id: "ws-2", name: "Workspace B (Global Marketing)", client: "Acme Global", region: "EU-West", timezone: "Europe/London", activeProfilesCount: 5 },
    { id: "ws-3", name: "TechStart Campaign Launch", client: "TechStart Inc", region: "US-West", timezone: "America/Los_Angeles", activeProfilesCount: 2 },
  ]);

  const activeBrand = brands.find(b => b.name === activeWorkspaceName) || brands[0];

  // Asset Folders (Isolated per Workspace)
  const [folders, setFolders] = useState<AssetFolder[]>([
    { id: "fol-1", name: "Brand Guidelines & Logos", path: "/logos/corporate", size: "420 MB", filesCount: 15 },
    { id: "fol-2", name: "Campaign Banner Graphics", path: "/promos/summer2026", size: "1.2 GB", filesCount: 48 },
    { id: "fol-3", name: "Video Explainer Clips", path: "/media/renderings", size: "8.4 GB", filesCount: 12 },
  ]);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");

  // Brand-Specific Social Profile Bundles
  const [bundles, setBundles] = useState<ProfileBundle[]>([
    { id: "bun-1", name: "Acme Corporate Core", platforms: ["LinkedIn", "Twitter / X"], description: "Primary channels for institutional updates." },
    { id: "bun-2", name: "Acme Consumer Reach", platforms: ["Facebook", "Instagram", "TikTok"], description: "B2C outreach for seasonal product launches." },
  ]);
  const [newBundleName, setNewBundleName] = useState("");
  const [newBundleDesc, setNewBundleDesc] = useState("");

  // Billing and Seat Allocation
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "mem-1", name: "Alex Mercer", email: "alex@acme.com", role: "Administrator", workspaceAccess: "All Workspaces" },
    { id: "mem-2", name: "Sarah Jenkins", email: "sarah@acme.com", role: "Editor", workspaceAccess: "Workspace A only" },
  ]);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Administrator" | "Editor" | "Billing Control">("Editor");

  const [timezoneVal, setTimezoneVal] = useState(activeBrand.timezone);
  const [localeLang, setLocaleLang] = useState("en-US");

  const handleBrandSwitch = (name: string) => {
    if (onWorkspaceChange) {
      onWorkspaceChange(name);
    }
    const selected = brands.find(b => b.name === name);
    if (selected) {
      setTimezoneVal(selected.timezone);
    }
    onNotify(`Switched Brand Context to: ${name}`, "INFO");
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName || !newFolderPath) return;

    setFolders(prev => [
      ...prev,
      { id: `fol-${Date.now()}`, name: newFolderName, path: newFolderPath.startsWith("/") ? newFolderPath : `/${newFolderPath}`, size: "0 KB", filesCount: 0 }
    ]);
    setNewFolderName("");
    setNewFolderPath("");
    onNotify(`Isolated asset library folder created: ${newFolderName}`, "INFO");
  };

  const handleDeleteFolder = (id: string, name: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    onNotify(`Purged asset folder: ${name}`, "WARN");
  };

  const handleCreateBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBundleName) return;

    setBundles(prev => [
      ...prev,
      { id: `bun-${Date.now()}`, name: newBundleName, platforms: ["LinkedIn", "Twitter / X"], description: newBundleDesc }
    ]);
    setNewBundleName("");
    setNewBundleDesc("");
    onNotify(`Social profile bundle defined: ${newBundleName}`, "INFO");
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setTeamMembers(prev => [
      ...prev,
      { id: `mem-${Date.now()}`, name: inviteName, email: inviteEmail, role: inviteRole, workspaceAccess: activeWorkspaceName }
    ]);
    setInviteName("");
    setInviteEmail("");
    onNotify(`Provisioned invitation email to ${inviteEmail}`, "AUDIT");
    alert(`Success! Invitation sent to ${inviteEmail} (Seat Allocated).`);
  };

  const handleSaveWorkspaceSettings = () => {
    setBrands(prev => prev.map(b => {
      if (b.name === activeWorkspaceName) {
        return { ...b, timezone: timezoneVal };
      }
      return b;
    }));
    onNotify(`Saved workspace localization preferences for ${activeWorkspaceName}`, "AUDIT");
    alert(`Workspace configuration updated successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Brand Context Switcher Bar */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-pink-500 flex items-center justify-center text-white">
              <Icons.Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Brand & Workspace Hub</h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Isolate digital assets, bundle target social channels, and provision client roles.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A1A1AA]">Active Account:</span>
            <select
              value={activeWorkspaceName}
              onChange={e => handleBrandSwitch(e.target.value)}
              className="bg-[#0B0B0F] border border-white/[0.08] text-xs text-white rounded-lg px-3.5 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            >
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Brand Context Detail */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/[0.04] font-mono text-[10px] text-[#A1A1AA]">
          <div>Client Group: <span className="text-white font-bold">{activeBrand.client}</span></div>
          <div>Hosting Region: <span className="text-white font-bold">{activeBrand.region}</span></div>
          <div>Time Zone: <span className="text-white font-bold">{activeBrand.timezone}</span></div>
          <div>Profiles Syncing: <span className="text-white font-bold">{activeBrand.activeProfilesCount} accounts</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Folder Manager */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Icons.Folder className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <span>Isolated Workspace Asset library Folders</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {folders.map(fol => (
              <div key={fol.id} className="bg-[#121218] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between hover:border-white/[0.12] transition">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <Icons.FolderClosed className="w-8 h-8 text-yellow-500/80 fill-yellow-500/10" />
                    <button
                      onClick={() => handleDeleteFolder(fol.id, fol.name)}
                      className="text-[#A1A1AA] hover:text-red-400 transition cursor-pointer"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white truncate">{fol.name}</h5>
                    <p className="text-[10px] text-[#A1A1AA] font-mono mt-0.5">{fol.path}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-[#A1A1AA]/60 mt-4 border-t border-white/[0.04] pt-2">
                  <span>Files: {fol.filesCount}</span>
                  <span>Size: {fol.size}</span>
                </div>
              </div>
            ))}

            {/* Add Folder form */}
            <form onSubmit={handleAddFolder} className="bg-[#121218]/50 border border-white/[0.08] border-dashed rounded-xl p-4 flex flex-col justify-between space-y-3.5">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Mount Isolated Directory</span>
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Folder Name..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="/assets/path..."
                  value={newFolderPath}
                  onChange={e => setNewFolderPath(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold py-1.5 rounded-lg transition"
              >
                Create Folder
              </button>
            </form>
          </div>
        </div>

        {/* Brand-Specific Social Profile Bundles */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Icons.Layers className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <span>Profile Bundle Groupings</span>
          </h4>

          <div className="space-y-3.5">
            {bundles.map(bundle => (
              <div key={bundle.id} className="bg-[#121218] border border-white/[0.08] p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-white">{bundle.name}</h5>
                  <span className="text-[9px] bg-[#8B5CF6]/10 text-[#8B5CF6] px-2 py-0.5 rounded border border-[#8B5CF6]/20 font-mono font-semibold">
                    {bundle.platforms.length} profiles
                  </span>
                </div>
                <p className="text-[10px] text-[#A1A1AA] leading-relaxed">{bundle.description}</p>
                <div className="flex flex-wrap gap-1 mt-2 font-mono text-[8px] text-[#A1A1AA]/60">
                  {bundle.platforms.map(p => (
                    <span key={p} className="bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06]">{p}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick Bundle Builder */}
            <form onSubmit={handleCreateBundle} className="bg-[#121218]/40 border border-white/[0.08] p-4 rounded-xl space-y-2">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Create Profile Bundle</span>
              <input
                type="text"
                required
                placeholder="Bundle Name (e.g. Acme Corp core)"
                value={newBundleName}
                onChange={e => setNewBundleName(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none"
              />
              <input
                type="text"
                placeholder="Description details..."
                value={newBundleDesc}
                onChange={e => setNewBundleDesc(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold py-1.5 rounded-lg transition"
              >
                Create Bundle
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing & Seat allocation dashboard */}
        <div className="lg:col-span-2 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-3 mb-2">
            <div className="flex items-center gap-2">
              <Icons.CreditCard className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Billing & Team Seat Allocations</h4>
            </div>

            <div className="text-[10px] font-mono text-[#A1A1AA]">
              Active Plan: <span className="text-[#8B5CF6] font-bold">Enterprise Agency tier</span> ($499/mo)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seat capacity Radial indicator */}
            <div className="bg-[#0B0B0F]/50 border border-white/[0.06] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-3">Seat Occupancy</span>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="#8B5CF6" strokeWidth="8" fill="transparent"
                    strokeDasharray="251.2" strokeDashoffset="125.6" strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-md font-extrabold text-white font-mono">2 / 5</span>
                  <span className="text-[7px] text-[#A1A1AA] uppercase">Seats</span>
                </div>
              </div>
            </div>

            {/* Team Members List */}
            <div className="md:col-span-2 space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {teamMembers.map(mem => (
                <div key={mem.id} className="flex items-center justify-between p-3 bg-[#0B0B0F]/30 border border-white/[0.04] rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-white font-bold block">{mem.name}</span>
                    <span className="text-[9px] text-[#A1A1AA]/60 mt-0.5">{mem.email}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] bg-slate-900 text-[#8B5CF6] px-1.5 py-0.2 rounded border border-[#8B5CF6]/30 font-semibold">{mem.role}</span>
                    <span className="block text-[8px] text-[#A1A1AA]/60 mt-1 font-sans">{mem.workspaceAccess}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seat Invite Form */}
          <form onSubmit={handleInviteMember} className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-white/[0.04] pt-4 mt-2">
            <div className="md:col-span-1">
              <input
                type="text"
                required
                placeholder="Full name..."
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="email"
                required
                placeholder="Email address..."
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none font-mono"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as any)}
                className="bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg cursor-pointer flex-1"
              >
                <option value="Editor">Editor</option>
                <option value="Administrator">Admin</option>
                <option value="Billing Control">Billing</option>
              </select>
              <button
                type="submit"
                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold px-3.5 rounded-lg transition"
              >
                Invite
              </button>
            </div>
          </form>
        </div>

        {/* Localizations & Settings parameters */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 mb-3">
              <Icons.Settings className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Localization & Preferences</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">Workspace Time Zone</label>
                <select
                  value={timezoneVal}
                  onChange={e => setTimezoneVal(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2.5 rounded-lg cursor-pointer focus:outline-none font-mono"
                >
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC / GMT</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">Display Language & Locale</label>
                <select
                  value={localeLang}
                  onChange={e => setLocaleLang(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2.5 rounded-lg cursor-pointer focus:outline-none font-mono"
                >
                  <option value="en-US">English (en-US)</option>
                  <option value="en-GB">English (en-GB)</option>
                  <option value="es-ES">Spanish (es-ES)</option>
                  <option value="de-DE">German (de-DE)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.04] mt-2 flex justify-end">
            <button
              onClick={handleSaveWorkspaceSettings}
              className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Save localization settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShortenedLink {
  id: string;
  originalUrl: string;
  shortenedUrl: string;
  customDomain: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  clicks: number;
  retargetingPixels: {
    meta?: string;
    google?: string;
    linkedin?: string;
  };
  geoClicks: Record<string, number>;
  createdAt: string;
}

interface LinkShortenerProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function LinkShortener({ onNotify }: LinkShortenerProps) {
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [shortening, setShortening] = useState(false);

  // Form parameters
  const [originalUrl, setOriginalUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("flux.ora");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");

  // Retargeting pixels
  const [pixelMeta, setPixelMeta] = useState("");
  const [pixelGoogle, setPixelGoogle] = useState("");
  const [pixelLinkedIn, setPixelLinkedIn] = useState("");

  // Bulk CSV import mockup
  const [csvFileSelected, setCsvFileSelected] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const [processingCsv, setProcessingCsv] = useState(false);

  const fetchLinkData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/links/list", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!res.ok) throw new Error("API Offline");
      const data = await res.json();
      setLinks(data);
    } catch {
      // Mock Data
      setLinks([
        {
          id: "link-1",
          originalUrl: "https://github.com/fluxora/telemetry/pull/1082",
          shortenedUrl: "flux.ora/t-1082",
          customDomain: "flux.ora",
          utmSource: "newsletter",
          utmMedium: "email",
          utmCampaign: "scaling-launch",
          clicks: 842,
          retargetingPixels: { meta: "px-meta-9092", google: "aw-google-112" },
          geoClicks: { US: 450, GB: 120, DE: 82, CA: 64, IN: 126 },
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          id: "link-2",
          originalUrl: "https://fluxora.com/jobs/senior-sre-telemetry",
          shortenedUrl: "jobs.fluxora.com/sre-s",
          customDomain: "jobs.fluxora.com",
          utmSource: "linkedin",
          utmMedium: "social",
          utmCampaign: "sre-recruiting",
          clicks: 318,
          retargetingPixels: { linkedin: "px-li-5541" },
          geoClicks: { US: 180, CA: 45, GB: 32, IN: 61 },
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkData();
  }, []);

  const handleShortenLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl.trim()) return;

    setShortening(true);
    const payload = {
      originalUrl: originalUrl.trim(),
      customDomain,
      utmSource: utmSource.trim(),
      utmMedium: utmMedium.trim(),
      utmCampaign: utmCampaign.trim(),
    };

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/links/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API Offline");
      const newLink = await res.json();
      setLinks((prev) => [newLink, ...prev]);
      onNotify(`Shortened URL generated: ${newLink.shortenedUrl}`, "INFO");
    } catch {
      const mockCode = Math.random().toString(36).substring(2, 6);
      const shortUrl = `${customDomain}/${mockCode}`;
      const newMockLink: ShortenedLink = {
        id: `link-demo-${Date.now()}`,
        originalUrl: originalUrl.trim(),
        shortenedUrl: shortUrl,
        customDomain,
        utmSource: utmSource.trim(),
        utmMedium: utmMedium.trim(),
        utmCampaign: utmCampaign.trim(),
        clicks: 0,
        retargetingPixels: {
          meta: pixelMeta.trim() || undefined,
          google: pixelGoogle.trim() || undefined,
          linkedin: pixelLinkedIn.trim() || undefined,
        },
        geoClicks: { US: 0 },
        createdAt: new Date().toISOString(),
      };
      setLinks((prev) => [newMockLink, ...prev]);
      onNotify(`Demo mode: Shortened URL generated: ${shortUrl}`, "INFO");
    } finally {
      setShortening(false);
      setOriginalUrl("");
      setUtmSource("");
      setUtmMedium("");
      setUtmCampaign("");
    }
  };

  const handleCsvImport = () => {
    if (!csvFileSelected) return;
    setProcessingCsv(true);
    setTimeout(() => {
      onNotify(`Successfully imported and processed CSV file "${csvFileName}". Generated 14 shortened links.`, "AUDIT");
      setProcessingCsv(false);
      setCsvFileSelected(false);
      setCsvFileName("");

      // Add a dummy shortened link from the CSV bulk batch
      const bulkLink: ShortenedLink = {
        id: `link-bulk-${Date.now()}`,
        originalUrl: "https://fluxora.com/blog/clickhouse-ingestion-scaling",
        shortenedUrl: "flux.ora/bulk-ch",
        customDomain: "flux.ora",
        utmSource: "csv-bulk",
        utmMedium: "import",
        utmCampaign: "batch-ops",
        clicks: 12,
        retargetingPixels: {},
        geoClicks: { US: 8, GB: 4 },
        createdAt: new Date().toISOString(),
      };
      setLinks((prev) => [bulkLink, ...prev]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Advanced UTM Builder & Link Shortening</h2>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Configure branded custom domains, compile campaigns with UTM tags, track geo hotspots, and import links in bulk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UTM Builder Form - Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <Icons.PlusCircle className="w-4 h-4 text-purple-400" />
              <span>UTM Link Generator</span>
            </h3>

            <form onSubmit={handleShortenLink} className="space-y-4">
              {/* Destination URL */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Target URL</label>
                <input
                  type="url"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/pricing"
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              {/* Branded Custom Domain */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Branded Domain</label>
                <select
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="flux.ora">flux.ora (Default)</option>
                  <option value="link.fluxora.com">link.fluxora.com (Verified)</option>
                  <option value="jobs.fluxora.com">jobs.fluxora.com (Verified)</option>
                </select>
              </div>

              {/* UTM fields */}
              <div className="grid grid-cols-3 gap-2 bg-[#0B0B0F]/40 p-3.5 rounded-xl border border-white/[0.04]">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-[#A1A1AA]">Source</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="linkedin"
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-[#A1A1AA]">Medium</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="social"
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-[#A1A1AA]">Campaign</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="scaling"
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Retargeting pixels config */}
              <div className="space-y-2.5 border-t border-white/[0.04] pt-3">
                <span className="block text-[9.5px] uppercase font-bold text-[#A1A1AA]">Retargeting Pixels</span>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] text-[#A1A1AA] w-12 font-mono">Meta:</span>
                    <input
                      type="text"
                      value={pixelMeta}
                      onChange={(e) => setPixelMeta(e.target.value)}
                      placeholder="Pixel ID"
                      className="flex-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] text-[#A1A1AA] w-12 font-mono">Google:</span>
                    <input
                      type="text"
                      value={pixelGoogle}
                      onChange={(e) => setPixelGoogle(e.target.value)}
                      placeholder="AW-ID"
                      className="flex-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] text-[#A1A1AA] w-12 font-mono">LinkedIn:</span>
                    <input
                      type="text"
                      value={pixelLinkedIn}
                      onChange={(e) => setPixelLinkedIn(e.target.value)}
                      placeholder="Insight ID"
                      className="flex-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={shortening}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-[#7C3AED]/20 transition cursor-pointer"
              >
                {shortening ? "Processing link..." : "⚡ Generate Short Link"}
              </button>
            </form>
          </div>
        </div>

        {/* Geo tracking map / bulk imports - Middle & Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Geotracking dashboard */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <Icons.Globe className="w-4 h-4 text-purple-400" />
              <span>Click-Tracking Geo-Overlay Map</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* SVG Map visualizer */}
              <div className="md:col-span-2 flex items-center justify-center bg-[#0B0B0F]/45 rounded-xl border border-white/[0.04] p-4 h-36">
                <svg className="w-full h-full max-w-[200px]" viewBox="0 0 100 50">
                  {/* Mock map paths */}
                  <rect x="10" y="10" width="20" height="15" rx="2" fill="rgba(255,255,255,0.06)" />
                  <rect x="40" y="5" width="25" height="20" rx="2" fill="rgba(255,255,255,0.06)" />
                  <rect x="70" y="20" width="20" height="20" rx="2" fill="rgba(255,255,255,0.06)" />
                  
                  {/* Click hot spots (radial pulses) */}
                  <circle cx="20" cy="18" r="4.5" fill="#7C3AED" className="animate-pulse" />
                  <circle cx="50" cy="15" r="3" fill="#EC4899" className="animate-pulse" />
                  <circle cx="82" cy="28" r="5" fill="#8B5CF6" className="animate-pulse" />
                </svg>
              </div>

              {/* Geo Breakdown */}
              <div className="md:col-span-1 space-y-2">
                <span className="block text-[9px] uppercase font-bold text-[#A1A1AA]">Top Countries</span>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-white">🇺🇸 United States</span>
                    <span className="font-bold text-[#8B5CF6]">630 clicks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">🇮🇳 India</span>
                    <span className="font-bold text-[#8B5CF6]">187 clicks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">🇬🇧 United Kingdom</span>
                    <span className="font-bold text-[#8B5CF6]">152 clicks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">🇨🇦 Canada</span>
                    <span className="font-bold text-[#8B5CF6]">109 clicks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Import modules */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Icons.UploadCloud className="w-4 h-4 text-purple-400" />
              <span>Bulk CSV Link Shortener</span>
            </h3>
            <p className="text-[11px] text-[#A1A1AA] mb-4">
              Upload a comma-separated CSV list containing destination URLs, UTM tracking fields, and target vanity links.
            </p>

            <div className="border border-dashed border-white/[0.08] bg-[#0B0B0F]/30 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
              {csvFileSelected ? (
                <>
                  <Icons.File className="w-8 h-8 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-mono">{csvFileName}</span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCsvImport}
                      disabled={processingCsv}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {processingCsv ? "Processing..." : "Process Bulk Import"}
                    </button>
                    <button
                      onClick={() => setCsvFileSelected(false)}
                      className="bg-[#121218] hover:bg-[#181821] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer border border-white/[0.08]"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Icons.Upload className="w-7 h-7 text-[#A1A1AA]/60" />
                  <button
                    onClick={() => {
                      setCsvFileSelected(true);
                      setCsvFileName("fluxora_bulk_utm_campaign.csv");
                    }}
                    className="text-xs font-bold text-[#8B5CF6] hover:underline cursor-pointer"
                  >
                    Select CSV File
                  </button>
                  <span className="text-[9px] text-[#A1A1AA]/50">Format: URL, Source, Medium, Campaign</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shortened Links Table */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icons.Link className="w-4 h-4 text-[#8B5CF6]" />
          <span>Active Shortened Links</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#A1A1AA] font-mono text-[9px] uppercase font-bold tracking-wider">
                <th className="pb-2">Vanity URL</th>
                <th className="pb-2">Original Destination</th>
                <th className="pb-2">UTM Tags</th>
                <th className="pb-2 text-right">Pixel Triggers</th>
                <th className="pb-2 text-right">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-white">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-white/[0.01]">
                  <td className="py-2.5 font-bold font-mono text-purple-400">{link.shortenedUrl}</td>
                  <td className="py-2.5 max-w-[200px] truncate text-[#A1A1AA]">{link.originalUrl}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] font-mono text-white bg-[#0B0B0F] border border-white/[0.08] px-2 py-0.5 rounded">
                      {link.utmSource || "-"} / {link.utmMedium || "-"} / {link.utmCampaign || "-"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[10px]">
                    {Object.keys(link.retargetingPixels).length > 0 ? (
                      <span className="text-emerald-400 font-bold">
                        {Object.keys(link.retargetingPixels).join(", ")}
                      </span>
                    ) : (
                      <span className="text-[#A1A1AA]/40">-</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold">{link.clicks}</td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[#A1A1AA]/50 italic">
                    No vanity links created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

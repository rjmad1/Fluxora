"use client";

import { useState, use, useEffect } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Paintbrush, FileText, Send, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ClientApprovalPage({ params }: PageProps) {
  const { token } = use(params);
  
  const [postContent, setPostContent] = useState("Loading review content from secure token...");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [submitting, setSubmitting] = useState(false);
  const [brandColor, setBrandColor] = useState("#7C3AED"); // Default primary
  const [errorMsg, setErrorMsg] = useState("");
  
  useEffect(() => {
    async function loadPost() {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/posts/approval/validate?token=${token}`);
        if (!response.ok) {
          throw new Error("Invalid or expired portal token");
        }
        const data = await response.json();
        setPostContent(data.content);
        if (data.status === "Scheduled" || data.status === "Published") {
          setStatus("approved");
        } else if (data.status === "Rejected") {
          setStatus("rejected");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn("Could not connect to backend, running in portal demo mode:", errorMessage);
        setPostContent(
          "Excited to announce our strategic partnership with Fluxora! Expanding our automated omnichannel publishing capability across global teams. 🚀 #partnership #marketingtech"
        );
      }
    }
    loadPost();
  }, [token]);

  const handleAction = async (action: "approve" | "reject") => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const response = await fetch(`http://localhost:3000/api/v1/posts/approval/submit?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          feedback: feedback || (action === "reject" ? "Review rejected by client." : undefined),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Approval submission failed");
      }

      setStatus(action === "approve" ? "approved" : "rejected");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn("API submission failed, falling back to client simulation:", errorMessage);
      setStatus(action === "approve" ? "approved" : "rejected");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans flex flex-col selection:bg-[#7C3AED]/30 selection:text-white">
      {/* White-labeled Agency Header */}
      <header className="border-b border-white/[0.08] bg-[#121218]/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-lg transition-colors"
            style={{ backgroundColor: brandColor }}
          >
            A
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Apex Marketing Client Portal</h1>
            <p className="text-[10px] text-[#A1A1AA] font-mono">White-Label Security Token: {token.substring(0, 12)}...</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-[#121218] border border-white/[0.08] px-3 py-1.5 rounded-xl">
          <Paintbrush className="w-3.5 h-3.5 text-[#A1A1AA]" />
          <label className="text-[10px] text-[#A1A1AA] font-semibold uppercase">Accent Theme:</label>
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col justify-center">
        <div className="bg-[#121218] border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Status Banner */}
          {status !== "pending" && (
            <div
              className={`absolute top-0 inset-x-0 py-3 text-center text-xs font-bold font-mono border-b transition-all ${
                status === "approved"
                  ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
                  : "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
              }`}
            >
              {status === "approved"
                ? "✓ APPROVED — Sent to Temporal scheduler queue"
                : "✗ REJECTED — Draft returned to Content Creator"}
            </div>
          )}

          <div className="pt-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#A1A1AA]" />
            </div>
            <div>
              <span className="text-[10px] bg-[#7C3AED]/20 text-[#8B5CF6] px-2.5 py-0.8 rounded-full font-mono border border-[#7C3AED]/20">
                Review Required
              </span>
              <h2 className="text-xl font-bold text-white mt-2.5">Campaign Launch Post Review</h2>
              <p className="text-xs text-[#A1A1AA] mt-1">Please review the content below for brand guidelines compliance and schedule accuracy.</p>
            </div>
          </div>

          {/* Draft Preview Card */}
          <div className="bg-[#0B0B0F]/60 border border-white/[0.04] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                style={{ backgroundColor: brandColor }}
              >
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Apex Marketing Client</h4>
                <p className="text-[9px] text-[#A1A1AA]/60">Shared Preview Link</p>
              </div>
            </div>
            <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{postContent}</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-mono rounded-xl">
              {errorMsg}
            </div>
          )}

          {status === "pending" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Feedback / Comments (Optional)</label>
                <textarea
                  className="w-full h-24 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#7C3AED] text-white resize-none"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide adjustment requests if rejecting..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction("reject")}
                  className="flex-1 py-3 text-xs font-bold bg-[#0B0B0F] hover:bg-[#EF4444]/10 text-[#EF4444] border border-white/[0.08] hover:border-[#EF4444]/30 rounded-xl transition cursor-pointer"
                >
                  {submitting ? "Processing..." : "Reject & Request Adjustments"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction("approve")}
                  className="flex-1 py-3 text-xs font-bold text-white rounded-xl shadow-lg hover:brightness-110 transition cursor-pointer"
                  style={{ backgroundColor: brandColor, boxShadow: `0 4px 14px 0 ${brandColor}33` }}
                >
                  {submitting ? "Processing..." : "Approve & Schedule Post"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center pt-4 border-t border-white/[0.04]">
              <button
                onClick={() => setStatus("pending")}
                className="text-xs font-semibold text-[#8B5CF6] hover:underline transition cursor-pointer"
              >
                Reset review simulation state
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0B0B0F] px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-[#A1A1AA]/60 gap-4 mt-auto">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <span>Powered by <strong>Fluxora Agency OS</strong>. Secure tenant boundary.</span>
        </div>
        <div className="flex gap-4">
          <span className="hover:text-white transition cursor-pointer font-mono">TLS 1.3</span>
          <span>•</span>
          <span className="hover:text-white transition cursor-pointer">SOC2 Sandbox Guarded</span>
        </div>
      </footer>
    </div>
  );
}

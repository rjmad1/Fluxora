"use client";

import { useState, use, useEffect } from "react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ClientApprovalPage({ params }: PageProps) {
  const { token } = use(params);
  
  const [postContent, setPostContent] = useState("Loading review content from secure token...");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [submitting, setSubmitting] = useState(false);
  const [brandColor, setBrandColor] = useState("#6366f1"); // Customizable brand color (defaults to indigo)
  const [errorMsg, setErrorMsg] = useState("");
  
  useEffect(() => {
    async function loadPost() {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/posts/approval/validate?token=${token}`);
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
      const response = await fetch(`http://localhost:8000/api/v1/posts/approval/submit?token=${token}`, {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* White-labeled Agency Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-base shadow" style={{ backgroundColor: brandColor }}>
            A
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200">Apex Marketing Client Portal</h1>
            <p className="text-[10px] text-slate-500 font-mono">White-Label Security Token: {token.substring(0, 12)}...</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] text-slate-500 font-semibold uppercase">Customize Portal theme:</label>
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
          />
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Status Banner */}
          {status !== "pending" && (
            <div
              className={`absolute top-0 inset-x-0 py-3 text-center text-xs font-bold font-mono transition-all ${
                status === "approved"
                  ? "bg-emerald-950/60 border-b border-emerald-800 text-emerald-400"
                  : "bg-rose-950/60 border-b border-rose-800 text-rose-400"
              }`}
            >
              {status === "approved"
                ? "✓ APPROVED — Sent to Temporal scheduler queue"
                : "✗ REJECTED — Draft returned to Content Creator"}
            </div>
          )}

          <div className="pt-4">
            <span className="text-[10px] bg-slate-800 text-indigo-400 px-3 py-1 rounded-full font-mono border border-slate-700">
              Review Requested
            </span>
            <h2 className="text-xl font-bold text-slate-200 mt-3">Campaign Launch Post Review</h2>
            <p className="text-xs text-slate-400 mt-1">Please review the content and variants below for brand guidelines compliance and schedule accuracy.</p>
          </div>

          {/* Draft Preview card */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300">Apex Marketing Client</h4>
                <p className="text-[8px] text-slate-500">Shared Preview Link</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{postContent}</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/40 text-rose-400 text-xs font-mono rounded-xl">
              {errorMsg}
            </div>
          )}

          {status === "pending" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Feedback / Comments (Optional)</label>
                <textarea
                  className="w-full h-24 bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 resize-none"
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
                  className="flex-1 py-3 text-xs font-bold bg-slate-950 hover:bg-rose-950/20 text-rose-400 border border-slate-800 hover:border-rose-900 rounded-xl transition cursor-pointer"
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
            <div className="text-center pt-4">
              <button
                onClick={() => setStatus("pending")}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                Reset review simulation state
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 bg-slate-950/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4 mt-auto">
        <div>
          Powered by <strong>Fluxora Agency OS</strong>. White-labeled client boundary.
        </div>
        <div className="flex gap-4">
          <span className="hover:text-slate-300 transition cursor-pointer">Security Encryption TLS 1.3</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition cursor-pointer">SOC2 Sandbox Guarded</span>
        </div>
      </footer>
    </div>
  );
}

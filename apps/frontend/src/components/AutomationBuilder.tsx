"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WorkflowStep {
  id: string;
  type: "trigger" | "condition" | "action";
  label: string;
  config: Record<string, any>;
}

interface AutomationBuilderProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function AutomationBuilder({ onNotify }: AutomationBuilderProps) {
  const [activeStepId, setActiveStepId] = useState<string | null>("step-trigger");
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: "step-trigger",
      type: "trigger",
      label: "Trigger: On Post Published",
      config: { event: "post.published", source: "any_network" }
    },
    {
      id: "step-condition",
      type: "condition",
      label: "Condition: If Engagement > 100",
      config: { metric: "clicks", operator: "gt", value: 100 }
    },
    {
      id: "step-action",
      type: "action",
      label: "Action: Auto-Comment & Like",
      config: { action: "auto_like", templateText: "Thanks for the support! Check our documentation at fluxora.io 🚀" }
    }
  ]);

  // Connection toggles
  const [webhookUrl, setWebhookUrl] = useState("https://api.myagency.com/hooks/fluxora");
  const [webhookActive, setWebhookActive] = useState(true);

  // Add step helper
  const addStep = (type: "condition" | "action") => {
    const newId = `step-${Date.now()}`;
    const newStep: WorkflowStep = {
      id: newId,
      type,
      label: type === "condition" ? "Condition: If Platform == LinkedIn" : "Action: Send Webhook Alert",
      config: type === "condition" ? { metric: "platform", operator: "eq", value: "linkedin" } : { action: "webhook", url: webhookUrl }
    };
    setSteps(prev => [...prev, newStep]);
    setActiveStepId(newId);
    onNotify(`Added automation workflow step (${type})`, "INFO");
  };

  // Delete step
  const deleteStep = (id: string) => {
    if (id === "step-trigger") {
      onNotify("Cannot delete trigger root step", "WARN");
      return;
    }
    setSteps(prev => prev.filter(s => s.id !== id));
    if (activeStepId === id) setActiveStepId(null);
    onNotify("Removed step from automation mapping", "INFO");
  };

  // Modify active step config
  const updateActiveStepConfig = (key: string, value: any) => {
    if (!activeStepId) return;
    setSteps(prev => prev.map(s => {
      if (s.id === activeStepId) {
        let label = s.label;
        if (s.type === "trigger") {
          label = `Trigger: On ${value === "post.published" ? "Post Published" : value === "milestone.reached" ? "Milestone Reached" : "Mention Received"}`;
        } else if (s.type === "condition") {
          if (key === "value" || key === "metric") {
            label = `Condition: If ${key === "metric" ? value : s.config.metric} matches`;
          }
        } else if (s.type === "action") {
          if (key === "action") {
            label = `Action: ${value === "auto_like" ? "Auto-Like & Retweet" : value === "auto_comment" ? "Auto-Comment Reply" : "Disptach Webhook"}`;
          }
        }
        return {
          ...s,
          label,
          config: { ...s.config, [key]: value }
        };
      }
      return s;
    }));
  };

  const activeStep = steps.find(s => s.id === activeStepId);

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center">
            <Icons.Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Automation Builder</h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Create step-by-step automatic loops, replies, and webhooks.</p>
          </div>
        </div>

        <button
          onClick={() => {
            onNotify("Automation campaign compiled and launched", "AUDIT");
            alert("Workflow is now live and scanning telemetry streams via ClickHouse!");
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
        >
          🚀 Publish Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Interactive Node Map */}
        <div className="lg:col-span-2 space-y-5 p-5 bg-[#0B0B0F]/40 border border-white/[0.08] border-dashed rounded-2xl flex flex-col items-center justify-center relative min-h-[450px]">
          <h4 className="absolute top-4 left-4 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Visual Step-by-Step Map</h4>

          <div className="flex flex-col items-center gap-4 w-full max-w-sm pt-6 pb-4">
            {steps.map((step, idx) => {
              const isSel = step.id === activeStepId;
              let nodeColor = "border-blue-500/40 text-blue-400 bg-blue-500/5";
              if (step.type === "condition") nodeColor = "border-amber-500/40 text-amber-400 bg-amber-500/5";
              if (step.type === "action") nodeColor = "border-emerald-500/40 text-emerald-400 bg-emerald-500/5";

              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <div className="h-6 w-0.5 bg-gradient-to-b from-[#7C3AED]/50 to-white/10 flex items-center justify-center">
                      <Icons.ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA]/60" />
                    </div>
                  )}

                  <div
                    onClick={() => setActiveStepId(step.id)}
                    className={`w-full p-4 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSel ? "ring-2 ring-[#7C3AED] border-[#7C3AED]" : "border-white/[0.08]"
                    } ${nodeColor}`}
                  >
                    <div className="flex items-center gap-3">
                      {step.type === "trigger" && <Icons.Play className="w-4 h-4" />}
                      {step.type === "condition" && <Icons.Filter className="w-4 h-4" />}
                      {step.type === "action" && <Icons.Settings className="w-4 h-4" />}
                      <div>
                        <h5 className="text-xs font-bold text-white">{step.label}</h5>
                        <p className="text-[9px] text-[#A1A1AA] mt-0.5 uppercase tracking-wide font-mono font-semibold">
                          Step #{idx + 1}
                        </p>
                      </div>
                    </div>
                    {step.id !== "step-trigger" && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteStep(step.id);
                        }}
                        className="text-[#A1A1AA] hover:text-red-400 transition"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Action buttons to expand map */}
          <div className="flex gap-3 mt-4 border-t border-white/[0.04] pt-4 w-full justify-center">
            <button
              onClick={() => addStep("condition")}
              className="bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icons.Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Condition</span>
            </button>
            <button
              onClick={() => addStep("action")}
              className="bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icons.Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Action</span>
            </button>
          </div>
        </div>

        {/* Right Step Configurations Side-Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {activeStep ? (
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-[#0B0B0F]/60 border border-white/[0.08] p-5 rounded-xl space-y-4"
              >
                <div className="border-b border-white/[0.04] pb-2 flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Configure Node</h4>
                  <span className="text-[9px] text-[#8B5CF6] font-mono capitalize">{activeStep.type}</span>
                </div>

                {activeStep.type === "trigger" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Trigger Event</label>
                      <select
                        value={activeStep.config.event}
                        onChange={e => updateActiveStepConfig("event", e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg cursor-pointer"
                      >
                        <option value="post.published">On Post Published</option>
                        <option value="milestone.reached">On Impression Milestone Reached</option>
                        <option value="mention.received">On Mention/Tag Received</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeStep.type === "condition" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Metric Metric</label>
                      <select
                        value={activeStep.config.metric}
                        onChange={e => updateActiveStepConfig("metric", e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg cursor-pointer"
                      >
                        <option value="clicks">Click Count</option>
                        <option value="views">Impression Count</option>
                        <option value="platform">Publishing Platform</option>
                      </select>
                    </div>
                    {activeStep.config.metric === "platform" ? (
                      <div>
                        <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Matching Platform</label>
                        <select
                          value={activeStep.config.value}
                          onChange={e => updateActiveStepConfig("value", e.target.value)}
                          className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg cursor-pointer"
                        >
                          <option value="linkedin">LinkedIn</option>
                          <option value="twitter">Twitter / X</option>
                          <option value="facebook">Facebook</option>
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Condition</label>
                          <select
                            value={activeStep.config.operator}
                            onChange={e => updateActiveStepConfig("operator", e.target.value)}
                            className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-1.5 rounded focus:outline-none"
                          >
                            <option value="gt">Greater Than</option>
                            <option value="lt">Less Than</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Value</label>
                          <input
                            type="number"
                            value={activeStep.config.value}
                            onChange={e => updateActiveStepConfig("value", Number(e.target.value))}
                            className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-1 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeStep.type === "action" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Select Action</label>
                      <select
                        value={activeStep.config.action}
                        onChange={e => updateActiveStepConfig("action", e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg cursor-pointer"
                      >
                        <option value="auto_like">Auto-Like Event Post</option>
                        <option value="auto_comment">Auto-Comment Reply Template</option>
                        <option value="webhook">Send Webhook Alert payload</option>
                      </select>
                    </div>
                    {activeStep.config.action === "auto_comment" ? (
                      <div>
                        <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Auto-reply template copy</label>
                        <textarea
                          value={activeStep.config.templateText || ""}
                          onChange={e => updateActiveStepConfig("templateText", e.target.value)}
                          placeholder="Type reply script template..."
                          className="w-full h-16 bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none resize-none"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-[#0B0B0F]/40 border border-white/[0.08] border-dashed rounded-xl p-4 text-center text-xs text-[#A1A1AA] py-10">
                💡 Select any step in visual map to configure trigger/conditionals/actions parameters.
              </div>
            )}
          </AnimatePresence>

          {/* Webhook Connection State */}
          <div className="bg-[#0B0B0F]/65 border border-white/[0.08] p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Outgoing Webhook Endpoint</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={webhookActive}
                  onChange={() => {
                    setWebhookActive(!webhookActive);
                    onNotify(`Webhook sync toggle set to ${!webhookActive}`, "WARN");
                  }}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#A1A1AA] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7C3AED] peer-checked:after:bg-white" />
              </label>
            </div>
            <div>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                disabled={!webhookActive}
                className="w-full bg-[#121218] border border-white/[0.08] disabled:opacity-50 text-[10px] text-white p-2 rounded focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

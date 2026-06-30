"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Cache,
  Trash2,
  Split,
  Server,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react";
import type { Suggestion } from "@/lib/types";
import { formatDuration, formatCurrency } from "@/lib/utils";

interface BottleneckPanelProps {
  suggestions: Suggestion[];
}

const suggestionIcons = {
  parallelization: Zap,
  caching: Cache,
  removal: Trash2,
  splitting: Split,
  "runner-upgrade": Server,
};

const severityStyles = {
  info: {
    icon: Info,
    bg: "from-blue-500/10 to-transparent",
    border: "border-blue-500/20",
    text: "text-blue-400",
    label: "bg-blue-500/20 text-blue-300",
  },
  warning: {
    icon: AlertTriangle,
    bg: "from-yellow-500/10 to-transparent",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
    label: "bg-yellow-500/20 text-yellow-300",
  },
  critical: {
    icon: AlertCircle,
    bg: "from-red-500/10 to-transparent",
    border: "border-red-500/20",
    text: "text-red-400",
    label: "bg-red-500/20 text-red-300",
  },
};

export function BottleneckPanel({ suggestions }: BottleneckPanelProps) {
  if (suggestions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-semibold text-white mb-1">No issues found!</h3>
        <p className="text-gray-400 text-sm">
          Your pipeline looks well-optimized. Great job!
        </p>
      </div>
    );
  }

  // Sort by severity then time saved
  const sorted = [...suggestions].sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.estimatedTimeSaved - a.estimatedTimeSaved;
  });

  const totalTimeSaved = sorted.reduce((sum, s) => sum + s.estimatedTimeSaved, 0);
  const totalCostSaved = sorted.reduce((sum, s) => sum + s.estimatedCostSaved, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Optimization Suggestions</h3>
          <p className="text-sm text-gray-400">
            {sorted.length} suggestions · {formatDuration(totalTimeSaved)} time ·{" "}
            {formatCurrency(totalCostSaved)} cost savings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((suggestion, idx) => {
          const Icon = suggestionIcons[suggestion.type] || Zap;
          const style = severityStyles[suggestion.severity];
          const SeverityIcon = style.icon;

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`glass-card p-5 bg-gradient-to-br ${style.bg} border ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${style.text}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white text-sm">{suggestion.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.label} flex items-center gap-1`}>
                      <SeverityIcon className="h-2.5 w-2.5" />
                      {suggestion.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    {suggestion.estimatedTimeSaved > 0 && (
                      <span className="text-green-400 flex items-center gap-1">
                        ⏱ Save {formatDuration(suggestion.estimatedTimeSaved)}
                      </span>
                    )}
                    {suggestion.estimatedCostSaved > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        💰 Save {formatCurrency(suggestion.estimatedCostSaved)}
                      </span>
                    )}
                    <span className="text-gray-500">
                      Affects: {suggestion.affectedJobs.length} job(s)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

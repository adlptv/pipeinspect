"use client";

import { motion } from "framer-motion";
import { Zap, AlertTriangle, AlertCircle, Info, TrendingDown } from "lucide-react";
import type { Suggestion } from "@/lib/types";
import { formatDuration, formatCurrency } from "@/lib/utils";

const suggestionConfig = {
  parallelization: { icon: Zap, color: "text-purple-400", label: "Parallelization" },
  caching: { icon: TrendingDown, color: "text-blue-400", label: "Caching" },
  removal: { icon: AlertCircle, color: "text-red-400", label: "Removal" },
  splitting: { icon: AlertTriangle, color: "text-orange-400", label: "Splitting" },
  "runner-upgrade": { icon: Info, color: "text-green-400", label: "Runner Upgrade" },
};

const severityConfig = {
  info: { border: "border-blue-500/20", bg: "bg-blue-500/5" },
  warning: { border: "border-yellow-500/20", bg: "bg-yellow-500/5" },
  critical: { border: "border-red-500/20", bg: "bg-red-500/5" },
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
}

export function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const config = suggestionConfig[suggestion.type] || suggestionConfig.parallelization;
  const sevConfig = severityConfig[suggestion.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`glass-card p-5 ${sevConfig.border} ${sevConfig.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white/5 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white text-sm">{suggestion.title}</h4>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-400">{config.label}</span>
          </div>
          <p className="text-sm text-gray-400 mb-3">{suggestion.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className={`px-2 py-0.5 rounded-full ${sevConfig.bg} ${config.color} font-medium`}>
              {suggestion.severity}
            </span>
            {suggestion.estimatedTimeSaved > 0 && (
              <span className="text-green-400">
                ⏱ {formatDuration(suggestion.estimatedTimeSaved)} saved
              </span>
            )}
            {suggestion.estimatedCostSaved > 0 && (
              <span className="text-emerald-400">
                💰 {formatCurrency(suggestion.estimatedCostSaved)} saved
              </span>
            )}
            <span className="text-gray-500">
              {suggestion.affectedJobs.length} job(s) affected
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

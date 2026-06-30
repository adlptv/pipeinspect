"use client";

import { motion } from "framer-motion";
import { Clock, DollarSign, Gauge, GitBranch, Zap, TrendingDown } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { formatDuration, formatCurrency, getComplexityColor, getComplexityLabel } from "@/lib/utils";

interface PipelineStatsProps {
  analysis: AnalysisResult;
}

export function PipelineStats({ analysis }: PipelineStatsProps) {
  const stats = [
    {
      icon: Clock,
      label: "Total Duration",
      value: formatDuration(analysis.totalDuration),
      sub: `Parallelized: ${formatDuration(analysis.parallelizedDuration)}`,
      color: "text-blue-400",
      bg: "from-blue-500/10 to-blue-500/5",
    },
    {
      icon: Gauge,
      label: "Complexity Score",
      value: `${analysis.complexityScore}/100`,
      sub: getComplexityLabel(analysis.complexityScore),
      color: getComplexityColor(analysis.complexityScore),
      bg: "from-purple-500/10 to-purple-500/5",
    },
    {
      icon: DollarSign,
      label: "Estimated Cost",
      value: formatCurrency(analysis.costEstimate.totalCost),
      sub: `${analysis.costEstimate.runnerMinutes} runner minutes`,
      color: "text-green-400",
      bg: "from-green-500/10 to-green-500/5",
    },
    {
      icon: GitBranch,
      label: "Jobs",
      value: `${analysis.pipeline.metadata.totalJobs}`,
      sub: `${analysis.pipeline.metadata.totalStages} stages · max ${analysis.pipeline.metadata.maxParallelism} parallel`,
      color: "text-orange-400",
      bg: "from-orange-500/10 to-orange-500/5",
    },
    {
      icon: Zap,
      label: "Suggestions",
      value: `${analysis.suggestions.length}`,
      sub: `${analysis.suggestions.filter((s) => s.severity === "critical").length} critical`,
      color: "text-yellow-400",
      bg: "from-yellow-500/10 to-yellow-500/5",
    },
    {
      icon: TrendingDown,
      label: "Potential Savings",
      value: formatDuration(
        analysis.suggestions.reduce((sum, s) => sum + s.estimatedTimeSaved, 0)
      ),
      sub: `${formatCurrency(
        analysis.suggestions.reduce((sum, s) => sum + s.estimatedCostSaved, 0)
      )} saved`,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className={`glass-card p-4 bg-gradient-to-br ${stat.bg}`}
        >
          <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
          <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}

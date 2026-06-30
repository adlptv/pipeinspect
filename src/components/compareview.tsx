"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  DollarSign,
  Gauge,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { formatDuration, formatCurrency, getComplexityColor, getComplexityLabel } from "@/lib/utils";

interface CompareViewProps {
  before: AnalysisResult;
  after: AnalysisResult;
  suggestionsApplied: number;
}

interface MetricCardProps {
  icon: typeof Clock;
  label: string;
  beforeValue: string;
  afterValue: string;
  improvement: string;
  positive: boolean;
  color: string;
}

function MetricCard({ icon: Icon, label, beforeValue, afterValue, improvement, positive, color }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Before</div>
          <div className="text-lg font-bold text-gray-300">{beforeValue}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-600" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">After</div>
          <div className={`text-lg font-bold ${color}`}>{afterValue}</div>
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${positive ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
          {improvement}
        </div>
      </div>
    </motion.div>
  );
}

export function CompareView({ before, after, suggestionsApplied }: CompareViewProps) {
  const timeSaved = before.totalDuration - after.totalDuration;
  const costSaved = before.costEstimate.totalCost - after.costEstimate.totalCost;
  const complexityReduced = before.complexityScore - after.complexityScore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Pipeline Comparison</h3>
            <p className="text-sm text-gray-400">
              {suggestionsApplied} optimization{suggestionsApplied !== 1 ? "s" : ""} applied ·{" "}
              {formatDuration(timeSaved)} time saved · {formatCurrency(costSaved)} cost saved
            </p>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          icon={Clock}
          label="Total Duration"
          beforeValue={formatDuration(before.totalDuration)}
          afterValue={formatDuration(after.totalDuration)}
          improvement={`-${formatDuration(timeSaved)}`}
          positive={timeSaved > 0}
          color="text-blue-400"
        />
        <MetricCard
          icon={DollarSign}
          label="Cost Per Run"
          beforeValue={formatCurrency(before.costEstimate.totalCost)}
          afterValue={formatCurrency(after.costEstimate.totalCost)}
          improvement={`-${formatCurrency(costSaved)}`}
          positive={costSaved > 0}
          color="text-green-400"
        />
        <MetricCard
          icon={Gauge}
          label="Complexity Score"
          beforeValue={`${before.complexityScore}/100`}
          afterValue={`${after.complexityScore}/100`}
          improvement={`${complexityReduced > 0 ? "-" : "+"}${Math.abs(complexityReduced)}`}
          positive={complexityReduced > 0}
          color={getComplexityColor(after.complexityScore)}
        />
        <MetricCard
          icon={GitBranch}
          label="Job Count"
          beforeValue={`${before.pipeline.metadata.totalJobs}`}
          afterValue={`${after.pipeline.metadata.totalJobs}`}
          improvement={`${after.pipeline.metadata.totalJobs - before.pipeline.metadata.totalJobs >= 0 ? "+" : ""}${after.pipeline.metadata.totalJobs - before.pipeline.metadata.totalJobs}`}
          positive={after.pipeline.metadata.totalJobs <= before.pipeline.metadata.totalJobs}
          color="text-orange-400"
        />
      </div>

      {/* Side-by-side suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-500" />
            Before Optimization
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{formatDuration(before.totalDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Parallelized</span>
              <span className="text-white">{formatDuration(before.parallelizedDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cost</span>
              <span className="text-white">{formatCurrency(before.costEstimate.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Complexity</span>
              <span className="text-white">{getComplexityLabel(before.complexityScore)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Suggestions</span>
              <span className="text-white">{before.suggestions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Jobs</span>
              <span className="text-white">{before.pipeline.metadata.totalJobs}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border border-green-500/20">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            After Optimization
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-green-400">{formatDuration(after.totalDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Parallelized</span>
              <span className="text-green-400">{formatDuration(after.parallelizedDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cost</span>
              <span className="text-green-400">{formatCurrency(after.costEstimate.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Complexity</span>
              <span className="text-green-400">{getComplexityLabel(after.complexityScore)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Suggestions</span>
              <span className="text-green-400">{after.suggestions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Jobs</span>
              <span className="text-green-400">{after.pipeline.metadata.totalJobs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projected savings */}
      <div className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="h-6 w-6 text-emerald-400" />
          <h4 className="font-semibold text-white">Projected Annual Savings</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatDuration(timeSaved * 365)}
            </div>
            <div className="text-xs text-gray-400">Time saved per year</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(costSaved * 365)}
            </div>
            <div className="text-xs text-gray-400">Cost saved per year</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {((timeSaved / before.totalDuration) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Efficiency improvement</div>
          </div>
        </div>
      </div>
    </div>
  );
}

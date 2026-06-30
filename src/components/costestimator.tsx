"use client";

import { motion } from "framer-motion";
import { DollarSign, Clock, TrendingDown, Server } from "lucide-react";
import type { CostEstimate } from "@/lib/types";
import { formatDuration, formatCurrency } from "@/lib/utils";

interface CostEstimatorProps {
  cost: CostEstimate;
  potentialSavings?: { time: number; cost: number };
}

export function CostEstimator({ cost, potentialSavings }: CostEstimatorProps) {
  const avgCostPerRun = cost.totalCost;
  const monthlyEstimate = avgCostPerRun * 30; // assuming ~30 runs/month
  const yearlyEstimate = avgCostPerRun * 365;

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-transparent"
        >
          <DollarSign className="h-6 w-6 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-green-400">
            {formatCurrency(avgCostPerRun)}
          </div>
          <div className="text-sm text-gray-400 mt-1">Per Pipeline Run</div>
          <div className="text-xs text-gray-500 mt-2">
            {formatCurrency(cost.costPerMinute)}/min · {formatDuration(cost.runnerMinutes)} total
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card p-6 bg-gradient-to-br from-blue-500/10 to-transparent"
        >
          <Clock className="h-6 w-6 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-blue-400">
            {formatCurrency(monthlyEstimate)}
          </div>
          <div className="text-sm text-gray-400 mt-1">Estimated Monthly Cost</div>
          <div className="text-xs text-gray-500 mt-2">
            Based on ~30 runs per month
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-transparent"
        >
          <Server className="h-6 w-6 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-purple-400">
            {formatCurrency(yearlyEstimate)}
          </div>
          <div className="text-sm text-gray-400 mt-1">Estimated Yearly Cost</div>
          <div className="text-xs text-gray-500 mt-2">
            Based on ~365 runs per year
          </div>
        </motion.div>
      </div>

      {/* Potential savings */}
      {potentialSavings && (potentialSavings.time > 0 || potentialSavings.cost > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <TrendingDown className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Potential Savings</h3>
              <p className="text-sm text-gray-400">If all suggestions are applied</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatDuration(potentialSavings.time)}
              </div>
              <div className="text-xs text-gray-400">Time saved per run</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(potentialSavings.cost)}
              </div>
              <div className="text-xs text-gray-400">Cost saved per run</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Projected monthly savings</span>
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(potentialSavings.cost * 30)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Projected yearly savings</span>
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(potentialSavings.cost * 365)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Per-job breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Per-Job Cost Breakdown</h3>
        <div className="space-y-2">
          {cost.breakdown.map((item, idx) => {
            const maxCost = Math.max(...cost.breakdown.map((b) => b.cost));
            const widthPct = (item.cost / maxCost) * 100;
            return (
              <motion.div
                key={item.jobName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="flex items-center gap-4"
              >
                <div className="w-32 text-sm text-gray-300 truncate flex-shrink-0">
                  {item.jobName}
                </div>
                <div className="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.5, delay: 0.2 + idx * 0.05 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end pr-2"
                  >
                    <span className="text-xs text-white font-medium">
                      {formatDuration(item.minutes)}
                    </span>
                  </motion.div>
                </div>
                <div className="w-20 text-right text-sm text-green-400 font-medium flex-shrink-0">
                  {formatCurrency(item.cost)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Cost model assumptions */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Cost Model Assumptions</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Standard Linux runner: $0.008/min (GitHub Actions pricing)</li>
          <li>• macOS runners: $0.08/min · Windows runners: $0.016/min (not factored in)</li>
          <li>• Self-hosted runners: $0.00/min (infrastructure costs not included)</li>
          <li>• Estimates assume ~30 runs/month and ~365 runs/year</li>
          <li>• Actual costs may vary based on runner type, region, and cloud provider</li>
        </ul>
      </div>
    </div>
  );
}

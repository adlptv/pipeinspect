"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import type { ParsedPipeline, AnalysisResult } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface TimelineProps {
  pipeline: ParsedPipeline;
  totalDuration: number;
  parallelizedDuration: number;
}

const STAGE_COLORS: Record<string, string> = {
  build: "from-blue-500 to-cyan-500",
  test: "from-purple-500 to-pink-500",
  deploy: "from-rose-500 to-red-500",
  "stage-3": "from-amber-500 to-orange-500",
  "stage-4": "from-emerald-500 to-green-500",
  default: "from-indigo-500 to-blue-500",
};

export function Timeline({ pipeline, totalDuration, parallelizedDuration }: TimelineProps) {
  const maxDuration = totalDuration;

  // Group jobs by stage
  const stages = pipeline.stages.map((stage) => {
    const jobs = stage.jobs
      .map((id) => pipeline.jobs.find((j) => j.id === id))
      .filter(Boolean) as typeof pipeline.jobs;

    const stageDuration = Math.max(...jobs.map((j) => j.estimatedDuration), 0);
    const offset = pipeline.stages
      .slice(0, stage.sequence)
      .reduce((sum, s) => {
        const sJobs = s.jobs
          .map((id) => pipeline.jobs.find((j) => j.id === id))
          .filter(Boolean) as typeof pipeline.jobs;
        return sum + Math.max(...sJobs.map((j) => j.estimatedDuration), 0);
      }, 0);

    return { ...stage, jobs, stageDuration, offset };
  });

  return (
    <div className="space-y-6">
      {/* Duration summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-gray-400">Sequential Duration</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatDuration(totalDuration)}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-gray-400">Parallelized Duration</div>
          <div className="text-2xl font-bold text-green-400">
            {formatDuration(parallelizedDuration)}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-gray-400">Time Saved</div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatDuration(totalDuration - parallelizedDuration)}
          </div>
        </div>
      </div>

      {/* Gantt-style timeline */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Execution Timeline</h3>

        {/* Stage labels and bars */}
        <div className="space-y-6">
          {stages.map((stage, idx) => {
            const gradient = STAGE_COLORS[stage.name] || STAGE_COLORS.default;
            const leftPct = (stage.offset / maxDuration) * 100;
            const widthPct = (stage.stageDuration / maxDuration) * 100;

            return (
              <div key={stage.name}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-white">
                    Stage {idx + 1}: {stage.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {stage.jobs.length} job(s) · {formatDuration(stage.stageDuration)}
                  </span>
                </div>

                {/* Stage bar */}
                <div className="relative h-6 rounded-lg bg-white/5 overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${widthPct}%`, opacity: 1 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className={`absolute top-0 h-full bg-gradient-to-r ${gradient} rounded-lg`}
                    style={{ left: `${leftPct}%` }}
                  />
                </div>

                {/* Job bars within stage */}
                <div className="space-y-1.5 ml-4">
                  {stage.jobs.map((job, jIdx) => {
                    const jobLeftPct = (stage.offset / maxDuration) * 100;
                    const jobWidthPct = (job.estimatedDuration / maxDuration) * 100;

                    return (
                      <div key={job.id} className="flex items-center gap-2">
                        <div className="w-32 text-xs text-gray-400 truncate flex-shrink-0">
                          {job.name}
                        </div>
                        <div className="flex-1 relative h-5 rounded bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${jobWidthPct}%` }}
                            transition={{ duration: 0.4, delay: idx * 0.1 + jIdx * 0.05 }}
                            className={`absolute top-0 h-full bg-gradient-to-r ${gradient} opacity-60 rounded flex items-center px-2`}
                            style={{ left: `${jobLeftPct}%` }}
                          >
                            <span className="text-[10px] text-white font-medium">
                              {formatDuration(job.estimatedDuration)}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Arrow to next stage */}
                {idx < stages.length - 1 && (
                  <div className="flex items-center justify-center mt-3">
                    <ArrowRight className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time axis */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between text-xs text-gray-500">
            <span>0m</span>
            <span>{formatDuration(maxDuration / 4)}</span>
            <span>{formatDuration(maxDuration / 2)}</span>
            <span>{formatDuration((maxDuration * 3) / 4)}</span>
            <span>{formatDuration(maxDuration)}</span>
          </div>
        </div>
      </div>

      {/* Parallel execution view */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Parallel Execution View</h3>
        <p className="text-sm text-gray-400 mb-4">
          Jobs within each stage run in parallel. Total wall time = sum of stage durations.
        </p>
        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const gradient = STAGE_COLORS[stage.name] || STAGE_COLORS.default;
            return (
              <div key={stage.name} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-300 flex-shrink-0">
                  {stage.name}
                </div>
                <div className={`flex-1 h-10 rounded-lg bg-gradient-to-r ${gradient} opacity-30 border border-white/10 flex items-center justify-center`}>
                  <span className="text-sm text-white font-medium">
                    {stage.jobs.map((j) => j.name).join(" ∥ ") || "—"}
                  </span>
                </div>
                <div className="w-16 text-right text-sm text-gray-400 flex-shrink-0">
                  {formatDuration(stage.stageDuration)}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <div className="w-24 text-sm font-medium text-white flex-shrink-0">Total</div>
            <div className="flex-1 h-2" />
            <div className="w-16 text-right text-sm font-bold text-green-400 flex-shrink-0">
              {formatDuration(parallelizedDuration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

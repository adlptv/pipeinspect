"use client";

import { motion } from "framer-motion";
import { X, Clock, Server, ListChecks, GitBranch, AlertTriangle } from "lucide-react";
import type { PipelineJob } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface JobDetailProps {
  job: PipelineJob;
  onClose: () => void;
}

export function JobDetail({ job, onClose }: JobDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="glass-card p-6 sticky top-20"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{job.name}</h3>
          {job.stage && (
            <span className="text-sm text-gray-400">Stage: {job.stage}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <p className="text-white font-semibold">{formatDuration(job.estimatedDuration)}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Server className="h-3 w-3" />
              Runner
            </div>
            <p className="text-white font-semibold text-sm truncate">{job.runner}</p>
          </div>
        </div>

        {/* Dependencies */}
        {job.dependencies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <GitBranch className="h-4 w-4" />
              Dependencies
            </div>
            <div className="flex flex-wrap gap-2">
              {job.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Commands */}
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <ListChecks className="h-4 w-4" />
            Commands ({job.commands.length})
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {job.commands.map((cmd, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-black/30 font-mono text-xs text-gray-300 break-all"
              >
                <span className="text-gray-600 mr-2">{i + 1}</span>
                {cmd}
              </div>
            ))}
          </div>
        </div>

        {/* Parallel indicator */}
        {job.parallel && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 text-purple-300 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Runs in parallel with siblings
          </div>
        )}

        {/* Environment */}
        {job.environment && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-300 text-sm">
            <span>🌍 Environment: {job.environment}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

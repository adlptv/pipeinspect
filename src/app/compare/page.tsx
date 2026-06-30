"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CompareView } from "@/components/CompareView";
import { Loader2, AlertCircle, ArrowRightLeft } from "lucide-react";
import type { AnalysisResult, ComparisonResult } from "@/lib/types";

export default function ComparePage() {
  const [beforeConfig, setBeforeConfig] = useState("");
  const [afterConfig, setAfterConfig] = useState("");
  const [format, setFormat] = useState<string>("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const handleCompare = async () => {
    if (!beforeConfig.trim() || !afterConfig.trim()) {
      setError("Please provide both configurations");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beforeConfig,
          afterConfig,
          format: format === "auto" ? undefined : format,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to compare configurations");
      }

      const data = await res.json();
      setComparison(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">Side-by-Side Comparison</h1>
        <p className="text-gray-400 mb-6">
          Compare two pipeline configurations to see the impact of your optimizations.
        </p>

        {!comparison && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Before (Original Config)
                </label>
                <textarea
                  value={beforeConfig}
                  onChange={(e) => setBeforeConfig(e.target.value)}
                  placeholder="Paste original CI config..."
                  className="w-full h-64 p-4 rounded-xl glass text-sm font-mono text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  After (Optimized Config)
                </label>
                <textarea
                  value={afterConfig}
                  onChange={(e) => setAfterConfig(e.target.value)}
                  placeholder="Paste optimized CI config..."
                  className="w-full h-64 p-4 rounded-xl glass text-sm font-mono text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm text-gray-400">Format:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none"
              >
                <option value="auto" className="bg-slate-800">Auto-detect</option>
                <option value="github-actions" className="bg-slate-800">GitHub Actions</option>
                <option value="gitlab-ci" className="bg-slate-800">GitLab CI</option>
                <option value="jenkinsfile" className="bg-slate-800">Jenkinsfile</option>
                <option value="circleci" className="bg-slate-800">CircleCI</option>
              </select>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleCompare}
              disabled={loading}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold disabled:opacity-50 transition-all hover:scale-105 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-5 w-5" />
              )}
              Compare Pipelines
            </button>
          </>
        )}

        {comparison && (
          <>
            <CompareView
              before={comparison.before}
              after={comparison.after}
              suggestionsApplied={comparison.suggestionsApplied}
            />
            <div className="mt-6">
              <button
                onClick={() => {
                  setComparison(null);
                  setBeforeConfig("");
                  setAfterConfig("");
                }}
                className="px-6 py-3 rounded-xl glass text-white hover:bg-white/10 transition-all"
              >
                ← Compare Again
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

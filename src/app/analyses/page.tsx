"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Plus, Clock, Gauge, Trash2, FileText } from "lucide-react";
import { formatRelativeTime, getComplexityColor, getComplexityLabel } from "@/lib/utils";

interface AnalysisSummary {
  id: string;
  name: string;
  format: string;
  complexityScore: number;
  createdAt: string;
  updatedAt: string;
}

export default function AnalysesPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await fetch("/api/analyses");
        if (!res.ok) throw new Error("Failed to fetch analyses");
        const data = await res.json();
        setAnalyses(data.analyses || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
        <p className="text-gray-400">Loading analyses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-300 font-medium mb-2">Failed to Load</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => router.push("/import")}
          className="px-6 py-3 rounded-xl glass text-white hover:bg-white/10 transition-all"
        >
          ← Import a Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Saved Analyses</h1>
            <p className="text-gray-400 text-sm mt-1">
              {analyses.length} saved analysis{analyses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => router.push("/import")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:scale-105 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Analysis
          </button>
        </div>

        {analyses.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No analyses yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Import a CI configuration and save your analysis to see it here.
            </p>
            <button
              onClick={() => router.push("/import")}
              className="px-6 py-3 rounded-xl glass text-white hover:bg-white/10 transition-all"
            >
              Import Pipeline →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((analysis, idx) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                onClick={() => router.push(`/analyses/${analysis.id}`)}
                className="glass-card p-5 cursor-pointer hover:glow transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                      {analysis.name}
                    </h3>
                    <span className="text-xs text-gray-500">{analysis.format}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(analysis.id, e)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Gauge className={`h-3 w-3 ${getComplexityColor(analysis.complexityScore)}`} />
                    <span className={getComplexityColor(analysis.complexityScore)}>
                      {getComplexityLabel(analysis.complexityScore)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(new Date(analysis.createdAt))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

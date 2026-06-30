"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DagGraph } from "@/components/DagGraph";
import { PipelineStats } from "@/components/PipelineStats";
import { BottleneckPanel } from "@/components/BottleneckPanel";
import { Loader2, AlertCircle, ArrowLeft, Trash2, BadgeCheck } from "lucide-react";
import type { AnalysisResult, ParsedPipeline, Suggestion } from "@/lib/types";

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyses/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch analysis");
        }
        const data = await res.json();
        setName(data.name);

        const pipeline: ParsedPipeline =
          typeof data.parsedPipeline === "string"
            ? JSON.parse(data.parsedPipeline)
            : data.parsedPipeline;

        const suggestions: Suggestion[] =
          typeof data.suggestions === "string"
            ? JSON.parse(data.suggestions)
            : data.suggestions;

        setAnalysis({
          pipeline,
          suggestions,
          criticalPath: [],
          totalDuration: 0,
          parallelizedDuration: 0,
          complexityScore: data.complexityScore,
          costEstimate: { runnerMinutes: 0, costPerMinute: 0.008, totalCost: 0, currency: "USD", breakdown: [] },
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAnalysis();
  }, [id]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/analyses");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
        <p className="text-gray-400">Loading analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-300 font-medium mb-2">Error</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => router.push("/analyses")}
          className="px-6 py-3 rounded-xl glass text-white hover:bg-white/10 transition-all"
        >
          ← Back to Analyses
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/analyses")}
              className="p-2 rounded-lg glass hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">{name}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {analysis.pipeline.metadata.totalJobs} jobs · {analysis.pipeline.format}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/export-badge?label=pipeline&value=${analysis.pipeline.format}&color=blue`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-white text-sm font-medium hover:bg-white/10 transition-all"
            >
              <BadgeCheck className="h-4 w-4" />
              Badge URL
            </a>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="mb-6">
          <PipelineStats analysis={analysis} />
        </div>

        <div className="mb-6">
          <DagGraph pipeline={analysis.pipeline} />
        </div>

        <div className="mb-6">
          <BottleneckPanel suggestions={analysis.suggestions} />
        </div>
      </motion.div>
    </div>
  );
}

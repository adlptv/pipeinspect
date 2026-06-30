"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DagGraph } from "@/components/DagGraph";
import { PipelineStats } from "@/components/PipelineStats";
import { BottleneckPanel } from "@/components/BottleneckPanel";
import { Loader2, AlertCircle, Download } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

export default function VisualizePage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      const configData = sessionStorage.getItem("pipeinspect-config");
      if (!configData) {
        router.push("/import");
        return;
      }

      try {
        const { config, format } = JSON.parse(configData);
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config, format }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to analyze pipeline");
        }

        const data = await res.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [router]);

  const handleSave = async () => {
    if (!analysis) return;
    const configData = sessionStorage.getItem("pipeinspect-config");
    if (!configData) return;

    const { config, format } = JSON.parse(configData);
    try {
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Analysis ${new Date().toLocaleString()}`,
          format,
          config,
          parsedPipeline: JSON.stringify(analysis.pipeline),
          suggestions: JSON.stringify(analysis.suggestions),
          complexityScore: analysis.complexityScore,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/analyses/${data.id}`);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
        <p className="text-gray-400">Analyzing pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-300 font-medium mb-2">Analysis Failed</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => router.push("/import")}
          className="px-6 py-3 rounded-xl glass text-white hover:bg-white/10 transition-all"
        >
          ← Back to Import
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
          <div>
            <h1 className="text-3xl font-bold gradient-text">Pipeline Visualization</h1>
            <p className="text-gray-400 text-sm mt-1">
              {analysis.pipeline.metadata.totalJobs} jobs · {analysis.pipeline.metadata.totalStages} stages ·{" "}
              {analysis.pipeline.format}
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-white text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Download className="h-4 w-4" />
            Save Analysis
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <PipelineStats analysis={analysis} />
        </div>

        {/* DAG Graph */}
        <div className="mb-6">
          <DagGraph pipeline={analysis.pipeline} />
        </div>

        {/* Bottlenecks & Suggestions */}
        <div className="mb-6">
          <BottleneckPanel suggestions={analysis.suggestions} />
        </div>
      </motion.div>
    </div>
  );
}

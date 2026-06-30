"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CostEstimator } from "@/components/CostEstimator";
import { Loader2, AlertCircle } from "lucide-react";
import type { AnalysisResult, CostEstimate } from "@/lib/types";

export default function CostPage() {
  const router = useRouter();
  const [cost, setCost] = useState<CostEstimate | null>(null);
  const [potentialSavings, setPotentialSavings] = useState<{ time: number; cost: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
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

        const data: AnalysisResult = await res.json();
        setCost(data.costEstimate);
        setPotentialSavings({
          time: data.suggestions.reduce((sum, s) => sum + s.estimatedTimeSaved, 0),
          cost: data.suggestions.reduce((sum, s) => sum + s.estimatedCostSaved, 0),
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
        <p className="text-gray-400">Calculating costs...</p>
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

  if (!cost) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">Cost Estimator</h1>
        <p className="text-gray-400 mb-6">
          Understand the financial impact of your CI/CD pipeline.
        </p>

        <CostEstimator cost={cost} potentialSavings={potentialSavings || undefined} />
      </motion.div>
    </div>
  );
}

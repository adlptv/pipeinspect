"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Link2,
  Code2,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn, detectCIFormat, sanitizeYamlInput } from "@/lib/utils";
import type { CIFormat } from "@/lib/types";

type ImportMethod = "paste" | "upload" | "url";

const SAMPLE_CONFIG = `name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install deps
        run: npm ci
      - name: Build
        run: npm run build

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install deps
        run: npm ci
      - name: Test
        run: npm test

  lint:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint

  deploy:
    needs: [test, lint]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - name: Deploy
        run: echo "Deploying..."`;

export function ImportForm() {
  const router = useRouter();
  const [method, setMethod] = useState<ImportMethod>("paste");
  const [config, setConfig] = useState("");
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<CIFormat | "auto">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setConfig(text);
      setFileName(file.name);
      const detected = detectCIFormat(text);
      setFormat(detected);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!config.trim()) {
      setError("Please provide a CI configuration");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sanitized = sanitizeYamlInput(config);
      const detectedFormat = format === "auto" ? detectCIFormat(sanitized) : format;

      // Store in sessionStorage for the visualize page to pick up
      sessionStorage.setItem("pipeinspect-config", JSON.stringify({ config: sanitized, format: detectedFormat }));

      // Also call the parse API to validate
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: sanitized, format: detectedFormat }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse configuration");
      }

      const data = await res.json();
      sessionStorage.setItem("pipeinspect-parsed", JSON.stringify(data));

      router.push("/visualize");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setConfig(SAMPLE_CONFIG);
    setMethod("paste");
    setFormat("github-actions");
  };

  const fetchFromUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
      const text = await res.text();
      setConfig(text);
      setFormat(detectCIFormat(text));
      setMethod("paste");
    } catch (err: any) {
      setError(`Failed to fetch URL: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Import Pipeline</h1>
        <p className="text-gray-400 mb-8">
          Paste your CI config, upload a file, or fetch from a URL to get started.
        </p>

        {/* Method tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "paste" as ImportMethod, label: "Paste Config", icon: Code2 },
            { id: "upload" as ImportMethod, label: "Upload File", icon: Upload },
            { id: "url" as ImportMethod, label: "GitHub URL", icon: Link2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethod(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                method === tab.id
                  ? "glass text-white glow"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Paste method */}
        {method === "paste" && (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder="Paste your CI/CD configuration here..."
                className="w-full h-80 p-4 rounded-xl glass text-sm font-mono text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                spellCheck={false}
              />
              {config && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {config.length} chars
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={loadSample}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Load sample GitHub Actions config
            </button>
          </div>
        )}

        {/* Upload method */}
        {method === "upload" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-16 text-center transition-all",
              dragActive
                ? "border-blue-500 bg-blue-500/10 glow"
                : "border-white/20 hover:border-white/40"
            )}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".yml,.yaml,.json,.groovy,.jenkinsfile"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-white mb-1">
                {fileName || "Drop your file here or click to browse"}
              </p>
              <p className="text-sm text-gray-500">
                Supports .yml, .yaml, .json, .groovy, Jenkinsfile
              </p>
            </label>
            {config && (
              <div className="mt-6 flex items-center justify-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Loaded {fileName}</span>
              </div>
            )}
          </div>
        )}

        {/* URL method */}
        {method === "url" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/user/repo/main/.github/workflows/ci.yml"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <button
                onClick={fetchFromUrl}
                disabled={loading || !url.trim()}
                className="px-6 py-3 rounded-xl glass text-white font-medium hover:bg-white/10 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Fetch
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Enter the raw URL to your CI config file (e.g., raw.githubusercontent.com)
            </p>
          </div>
        )}

        {/* Format selector */}
        <div className="mt-6 flex items-center gap-4">
          <label className="text-sm text-gray-400">CI Format:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as CIFormat | "auto")}
            className="px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="auto" className="bg-slate-800">Auto-detect</option>
            <option value="github-actions" className="bg-slate-800">GitHub Actions</option>
            <option value="gitlab-ci" className="bg-slate-800">GitLab CI</option>
            <option value="jenkinsfile" className="bg-slate-800">Jenkinsfile</option>
            <option value="circleci" className="bg-slate-800">CircleCI</option>
          </select>
          {config && format !== "auto" && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Format set
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Error</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || !config.trim()}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Parsing...
              </>
            ) : (
              "Analyze Pipeline →"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

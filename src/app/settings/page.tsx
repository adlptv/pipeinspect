"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Database, Github, Server, Save, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    costPerMinute: "0.008",
    currency: "USD",
    defaultFormat: "auto",
    theme: "dark",
    githubToken: "",
    gitlabToken: "",
    gitlabUrl: "https://gitlab.com/api/v4",
    rateLimitMax: "100",
    corsOrigin: "*",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pipeinspect-settings");
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("pipeinspect-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = {
      costPerMinute: "0.008",
      currency: "USD",
      defaultFormat: "auto",
      theme: "dark",
      githubToken: "",
      gitlabToken: "",
      gitlabUrl: "https://gitlab.com/api/v4",
      rateLimitMax: "100",
      corsOrigin: "*",
    };
    setSettings(defaults);
    localStorage.setItem("pipeinspect-settings", JSON.stringify(defaults));
  };

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        </div>

        {/* Cost Settings */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-green-400" />
            Cost Model
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Cost per minute ($)</label>
              <input
                type="number"
                step="0.001"
                value={settings.costPerMinute}
                onChange={(e) => update("costPerMinute", e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none"
              >
                <option value="USD" className="bg-slate-800">USD ($)</option>
                <option value="EUR" className="bg-slate-800">EUR (€)</option>
                <option value="GBP" className="bg-slate-800">GBP (£)</option>
                <option value="JPY" className="bg-slate-800">JPY (¥)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Default Format */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-400" />
            Pipeline Defaults
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Default CI Format</label>
              <select
                value={settings.defaultFormat}
                onChange={(e) => update("defaultFormat", e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none"
              >
                <option value="auto" className="bg-slate-800">Auto-detect</option>
                <option value="github-actions" className="bg-slate-800">GitHub Actions</option>
                <option value="gitlab-ci" className="bg-slate-800">GitLab CI</option>
                <option value="jenkinsfile" className="bg-slate-800">Jenkinsfile</option>
                <option value="circleci" className="bg-slate-800">CircleCI</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => update("theme", e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none"
              >
                <option value="dark" className="bg-slate-800">Dark</option>
                <option value="light" className="bg-slate-800">Light</option>
                <option value="system" className="bg-slate-800">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Tokens */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Github className="h-5 w-5 text-orange-400" />
            API Integrations
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">GitHub Token (optional)</label>
              <input
                type="password"
                value={settings.githubToken}
                onChange={(e) => update("githubToken", e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for fetching CI configs from private repos
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">GitLab Token (optional)</label>
              <input
                type="password"
                value={settings.gitlabToken}
                onChange={(e) => update("gitlabToken", e.target.value)}
                placeholder="glpat-xxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">GitLab API URL</label>
              <input
                type="url"
                value={settings.gitlabUrl}
                onChange={(e) => update("gitlabUrl", e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Rate Limiting & CORS</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Max Requests / 15min</label>
              <input
                type="number"
                value={settings.rateLimitMax}
                onChange={(e) => update("rateLimitMax", e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">CORS Origin</label>
              <input
                type="text"
                value={settings.corsOrigin}
                onChange={(e) => update("corsOrigin", e.target.value)}
                placeholder="* or https://example.com"
                className="w-full px-3 py-2 rounded-lg glass text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:scale-105 transition-all"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-green-400"
            >
              ✓ Settings saved
            </motion.span>
          )}
        </div>

        {/* Data management */}
        <div className="glass-card p-6 mt-6 border border-red-500/20">
          <h2 className="text-lg font-semibold text-white mb-2">Data Management</h2>
          <p className="text-sm text-gray-400 mb-4">
            Manage locally stored data and cached analyses.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("pipeinspect-settings");
              localStorage.removeItem("pipeinspect-config");
              sessionStorage.removeItem("pipeinspect-config");
              sessionStorage.removeItem("pipeinspect-parsed");
              router.push("/import");
            }}
            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-all"
          >
            Clear All Local Data
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

export function generateId(): string {
  return `job_${Math.random().toString(36).slice(2, 9)}`;
}

export function sanitizeYamlInput(input: string): string {
  // Remove potentially dangerous YAML tags
  return input
    .replace(/!!python\/[\w/]+/g, "")
    .replace(/!!ruby\/[\w:]+/g, "")
    .replace(/!!java\/[\w.]+/g, "")
    .replace(/<%[\s\S]*?%>/g, "") // ERB tags
    .replace(/\$\{[\s\S]*?\}/g, (match) => {
      // Keep ${{ }} (GitHub Actions expressions) but remove others
      if (match.startsWith("${{")) return match;
      return "";
    });
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function detectCIFormat(config: string): "github-actions" | "gitlab-ci" | "jenkinsfile" | "circleci" {
  const trimmed = config.trim();

  if (trimmed.includes("pipeline {") || trimmed.includes("pipeline{")) {
    return "jenkinsfile";
  }
  if (trimmed.includes("version:") && trimmed.includes("jobs:") && trimmed.includes("orbs:")) {
    return "circleci";
  }
  if (trimmed.includes("on:") && (trimmed.includes("jobs:") || trimmed.includes("runs-on:"))) {
    return "github-actions";
  }
  if (trimmed.includes("stages:") || (trimmed.includes("script:") && !trimmed.includes("runs-on:"))) {
    return "gitlab-ci";
  }

  // Default heuristic
  if (trimmed.includes("runs-on:")) return "github-actions";
  if (trimmed.includes("image:")) return "gitlab-ci";
  return "github-actions";
}

export function getComplexityColor(score: number): string {
  if (score < 25) return "text-green-500";
  if (score < 50) return "text-yellow-500";
  if (score < 75) return "text-orange-500";
  return "text-red-500";
}

export function getComplexityLabel(score: number): string {
  if (score < 25) return "Simple";
  if (score < 50) return "Moderate";
  if (score < 75) return "Complex";
  return "Very Complex";
}

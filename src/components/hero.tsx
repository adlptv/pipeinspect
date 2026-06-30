"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GitBranch,
  Zap,
  DollarSign,
  TrendingDown,
  ArrowRight,
  Workflow,
  Clock,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Multi-Format Support",
    description:
      "Parse GitHub Actions, GitLab CI, Jenkinsfiles, and CircleCI configs. Automatically detect format or specify manually.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Workflow,
    title: "Interactive DAG Visualization",
    description:
      "See your pipeline as an interactive directed acyclic graph. Drag nodes, click for details, highlight critical paths.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Bottleneck Detection",
    description:
      "Automatically identify slow jobs, duplicate work, and missing parallelization opportunities with actionable suggestions.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: DollarSign,
    title: "Cost Estimation",
    description:
      "Understand the financial impact of your pipelines. Estimate runner costs, see per-job breakdowns, and model savings.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingDown,
    title: "Optimization Suggestions",
    description:
      "Get specific, actionable recommendations: parallelize, cache, split, consolidate, or upgrade runners to save time and money.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: Clock,
    title: "Execution Timeline",
    description:
      "Visualize job execution order and timing. See which jobs block others and identify opportunities for parallel execution.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: ShieldCheck,
    title: "Side-by-Side Comparison",
    description:
      "Compare pipeline configurations before and after optimization. Quantify time saved, cost reduced, and complexity changes.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: ArrowRight,
    title: "Export & Share",
    description:
      "Generate shields.io badges for your README, export analysis results, and share insights with your team.",
    gradient: "from-teal-500 to-cyan-500",
  },
];

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-gray-300 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Supports GitHub Actions, GitLab CI, Jenkins & CircleCI
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="gradient-text">Visualize & Optimize</span>
            <br />
            <span className="text-white">Your CI/CD Pipelines</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Parse any CI configuration, see the DAG, find bottlenecks, estimate costs, and get
            actionable optimization suggestions — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/import"
              className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg transition-all hover:scale-105 hover:glow-strong"
            >
              <span className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/visualize"
              className="px-8 py-3.5 rounded-xl glass text-white font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Try Demo
            </Link>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { label: "CI Formats", value: "4+" },
            { label: "Suggestion Types", value: "5" },
            { label: "Avg. Time Saved", value: "35%" },
            { label: "Cost Visibility", value: "100%" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need to ship faster
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From parsing to optimization, PipeInspect gives you deep insights into your CI/CD
            pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="glass-card p-6 hover:glow transition-all group"
            >
              <div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="container mx-auto px-4 py-16">
        <div className="glass-card p-12 text-center max-w-3xl mx-auto glow">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to optimize your pipelines?
          </h2>
          <p className="text-gray-400 mb-8">
            Import your CI configuration in seconds and get instant insights.
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg transition-all hover:scale-105"
          >
            Import Your Pipeline
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

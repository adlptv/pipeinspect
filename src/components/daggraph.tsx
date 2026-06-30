"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import type { ParsedPipeline, DAGNode, DAGEdge } from "@/lib/types";
import { JobDetail } from "./JobDetail";

interface DagGraphProps {
  pipeline: ParsedPipeline;
}

const STAGE_COLORS: Record<string, string> = {
  build: "#3b82f6",
  test: "#a855f7",
  deploy: "#ec4899",
  "stage-3": "#f59e0b",
  "stage-4": "#10b981",
  default: "#6366f1",
};

function getStageColor(stage?: string): string {
  return STAGE_COLORS[stage || "default"] || STAGE_COLORS.default;
}

export function DagGraph({ pipeline }: DagGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<DAGNode[]>([]);
  const [edges, setEdges] = useState<DAGEdge[]>([]);

  useEffect(() => {
    if (!pipeline) return;

    const nodeData = pipeline.dag.map((n) => ({ ...n }));
    const edgeData = pipeline.edges.map((e) => ({ ...e }));

    setNodes(nodeData);
    setEdges(edgeData);

    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*).remove();

    const width = 900;
    const height = 500;

    svg.attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "w-full h-full");

    // Gradient defs
    const defs = svg.append("defs");
    Object.entries(STAGE_COLORS).forEach(([name, color]) => {
      const gradient = defs.append("radialGradient")
        .attr("id", `grad-${name}`)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");
      gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.9);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.5);
    });

    // Arrow marker
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    // Container group for zoom
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation<DAGNode & d3.SimulationNodeDatum>(nodeData)
      .force("link", d3.forceLink<DAGNode & d3.SimulationNodeDatum, DAGEdge & { source: any; target: any }>(edgeData as any)
        .id((d: any) => d.id)
        .distance(100)
        .strength(0.6))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collision", d3.forceCollide().radius(40));

    // Links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(edgeData)
      .enter()
      .append("path")
      .attr("class", "dag-link")
      .attr("stroke", (d: any) => d.type === "stage-order" ? "#4b5563" : "#6366f1")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d: any) => d.type === "stage-order" ? "5,5" : "none")
      .attr("marker-end", "url(#arrowhead)");

    // Nodes group
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, DAGNode & d3.SimulationNodeDatum>("g")
      .data(nodeData)
      .enter()
      .append("g")
      .attr("class", "dag-node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, DAGNode & d3.SimulationNodeDatum>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Node circles
    node.append("circle")
      .attr("r", (d) => d.isBottleneck ? 24 : 20)
      .attr("fill", (d) => `url(#grad-${d.stage || "default"})`)
      .attr("stroke", (d) => {
        if (d.isBottleneck) return "#ef4444";
        if (d.isCriticalPath) return "#fbbf24";
        return "rgba(255,255,255,0.2)";
      })
      .attr("stroke-width", (d) => {
        if (d.isBottleneck) return 3;
        if (d.isCriticalPath) return 2.5;
        return 1;
      })
      .attr("filter", (d) => d.isBottleneck ? "drop-shadow(0 0 8px #ef4444)" : "none");

    // Duration text inside node
    node.append("text")
      .attr("class", "dag-label")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text((d) => `${d.duration}m`);

    // Node labels
    node.append("text")
      .attr("class", "dag-label")
      .attr("text-anchor", "middle")
      .attr("dy", "40px")
      .attr("fill", "#e5e7eb")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .text((d) => d.label);

    // Bottleneck icon
    node.filter((d) => d.isBottleneck)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-28px")
      .attr("font-size", "16px")
      .text("⚠️");

    // Critical path icon
    node.filter((d) => d.isCriticalPath && !d.isBottleneck)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-28px")
      .attr("font-size", "14px")
      .text("⭐");

    // Click handler
    node.on("click", (_event, d) => {
      setSelectedJobId(d.id);
      // Highlight selected
      d3.selectAll<SVGCircleElement, DAGNode>("circle")
        .attr("stroke-opacity", 0.5);
      d3.select<SVGCircleElement, DAGNode>(`#${d.id}`).attr("stroke-opacity", 1);
    });

    // Tooltip on hover
    node.append("title")
      .text((d) => `${d.label}\nDuration: ${d.duration}m\nStage: ${d.stage || "default"}\n${d.isBottleneck ? "⚠️ Bottleneck\n" : ""}${d.isCriticalPath ? "⭐ Critical Path\n" : ""}`);

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [pipeline]);

  const selectedJob = selectedJobId
    ? pipeline.jobs.find((j) => j.id === selectedJobId)
    : null;

  const handleReset = useCallback(() => {
    setSelectedJobId(null);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Graph */}
      <div className="flex-1 glass-card p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Pipeline DAG</h3>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400" /> Critical Path
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Bottleneck
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500" /> Job
            </span>
          </div>
        </div>
        <svg ref={svgRef} className="w-full" style={{ minHeight: "500px" }} />
        <p className="text-xs text-gray-500 mt-2 text-center">
          Drag nodes to rearrange · Scroll to zoom · Click a node for details
        </p>
      </div>

      {/* Job detail panel */}
      {selectedJob && (
        <div className="lg:w-96 flex-shrink-0">
          <JobDetail job={selectedJob} onClose={handleReset} />
        </div>
      )}
    </div>
  );
}

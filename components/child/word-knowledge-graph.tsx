"use client";

/**
 * Word Knowledge Graph – Epic 8.1
 *
 * Pure-React / SVG visualization of the vocabulary knowledge sub-graph
 * returned by GET /adaptive/{child_id}/word-graph/{word_id}.
 *
 * Layout: simple circular arrangement of neighbours around the centre node.
 * No external graph library required.
 */
import React, { useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type {
  WordGraph,
  WordNode,
  WordEdge,
  RelationshipType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Relationship colour map
// ---------------------------------------------------------------------------
const REL_COLORS: Record<RelationshipType, string> = {
  semantic: "#6366f1", // indigo
  category: "#10b981", // emerald
  phonetic: "#f59e0b", // amber
  contextual: "#3b82f6", // blue
  opposite: "#ef4444", // red
};

const REL_LABELS: Record<RelationshipType, string> = {
  semantic: "同義",
  category: "同類",
  phonetic: "諧音",
  contextual: "場景",
  opposite: "相反",
};

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
interface LayoutNode extends WordNode {
  x: number;
  y: number;
}

function computeLayout(
  graph: WordGraph,
  width: number,
  height: number,
): LayoutNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) * 0.65;

  const neighbours = graph.nodes.filter(
    (n) => n.word_id !== graph.centre_word_id,
  );
  const total = neighbours.length || 1;

  const positions: LayoutNode[] = [];

  // Centre node
  const centre = graph.nodes.find((n) => n.word_id === graph.centre_word_id);
  if (centre) {
    positions.push({ ...centre, x: cx, y: cy });
  }

  neighbours.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / total - Math.PI / 2;
    positions.push({
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  return positions;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface NodeProps {
  node: LayoutNode;
  isCentre: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (node: LayoutNode) => void;
}

function GraphNode({ node, isCentre, isHovered, onHover, onClick }: NodeProps) {
  const r = isCentre ? 42 : 32;
  const bg = isCentre ? "#6366f1" : node.mastered ? "#10b981" : "#e2e8f0";
  const textColor = isCentre || node.mastered ? "white" : "#334155";
  const label = node.word_cantonese || node.word;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => onHover(node.word_id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={isHovered ? r + 4 : r}
        fill={bg}
        stroke={isHovered ? "#6366f1" : "white"}
        strokeWidth={isHovered ? 3 : 2}
        className="transition-all duration-200"
      />
      <text
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={isCentre ? 16 : 14}
        fontWeight="bold"
        style={{
          fontFamily: "'Noto Sans TC', sans-serif",
          pointerEvents: "none",
        }}
      >
        {label && label.length > 3 ? label.slice(0, 3) + "…" : label}
      </text>
      {node.jyutping && (
        <text
          x={node.x}
          y={node.y + r + 12}
          textAnchor="middle"
          fill="#6366f1"
          fontSize={10}
          style={{ pointerEvents: "none" }}
        >
          {node.jyutping.split(" ")[0]}
        </text>
      )}
    </g>
  );
}

interface EdgeProps {
  edge: WordEdge;
  positions: LayoutNode[];
}

function GraphEdge({ edge, positions }: EdgeProps) {
  const src = positions.find((n) => n.word_id === edge.source_id);
  const tgt = positions.find((n) => n.word_id === edge.target_id);
  if (!src || !tgt) return null;

  const color = REL_COLORS[edge.relationship_type] ?? "#94a3b8";
  const opacity = 0.3 + edge.strength * 0.5;

  return (
    <line
      x1={src.x}
      y1={src.y}
      x2={tgt.x}
      y2={tgt.y}
      stroke={color}
      strokeWidth={1 + edge.strength * 2}
      strokeOpacity={opacity}
      strokeLinecap="round"
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface WordKnowledgeGraphProps {
  graph: WordGraph;
  onNodeClick?: (node: WordNode) => void;
  className?: string;
  width?: number;
  height?: number;
}

export function WordKnowledgeGraph({
  graph,
  onNodeClick,
  className,
  width = 360,
  height = 320,
}: WordKnowledgeGraphProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<LayoutNode | null>(null);

  const positions = useMemo(
    () => computeLayout(graph, width, height),
    [graph, width, height],
  );

  const handleClick = useCallback(
    (node: LayoutNode) => {
      setSelected((prev) => (prev?.word_id === node.word_id ? null : node));
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  // Deduplicate relationship types for legend
  const usedTypes = useMemo(
    () => [...new Set(graph.edges.map((e) => e.relationship_type))],
    [graph.edges],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* SVG graph */}
      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
        >
          {/* Edges (drawn first so nodes appear on top) */}
          {graph.edges.map((edge, i) => (
            <GraphEdge key={i} edge={edge} positions={positions} />
          ))}

          {/* Nodes */}
          {positions.map((node) => (
            <GraphNode
              key={node.word_id}
              node={node}
              isCentre={node.word_id === graph.centre_word_id}
              isHovered={hovered === node.word_id}
              onHover={setHovered}
              onClick={handleClick}
            />
          ))}
        </svg>
      </div>

      {/* Node detail card */}
      {selected && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-sm">
          <p
            className="text-2xl font-black text-slate-800"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            {selected.word_cantonese || selected.word}
          </p>
          {selected.jyutping && (
            <p className="text-indigo-500 font-semibold text-sm">
              {selected.jyutping}
            </p>
          )}
          {selected.word_cantonese && selected.word && (
            <p className="text-slate-400 text-xs">{selected.word}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full capitalize">
              {selected.category}
            </span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full capitalize">
              {selected.difficulty}
            </span>
            {selected.mastered && (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                ✓ 已掌握
              </span>
            )}
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
              接觸 {selected.exposure_count} 次
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      {usedTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {usedTypes.map((type) => (
            <span
              key={type}
              className="flex items-center gap-1 text-xs text-slate-600"
            >
              <span
                className="inline-block w-3 h-1 rounded-full"
                style={{ backgroundColor: REL_COLORS[type] }}
              />
              {REL_LABELS[type]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

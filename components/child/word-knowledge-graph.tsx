"use client";

/**
 * Word Knowledge Graph – Epic 8.1 (Child-friendly redesign)
 *
 * • Large hero card for the centre word (with photo)
 * • 2-column grid of big colourful cards for related words (with photos)
 * • Tapping any card opens WordDetailModal with full word details
 * • onNodeClick is still called so the parent can load that word's sub-graph
 */
import React, { useState, useCallback, useEffect } from "react";
import { Star, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WordGraph, WordNode, RelationshipType, Word } from "@/lib/types";
import { getWord, toWord } from "@/lib/api/vocabulary";
import { WordDetailModal } from "@/components/modals/word-detail-modal";

// ---------------------------------------------------------------------------
// Relationship styles — child-friendly labels & badge colours
// ---------------------------------------------------------------------------
const REL_STYLES: Record<RelationshipType, { label: string; badge: string }> = {
  semantic: { label: "同義詞", badge: "bg-white/25 text-white" },
  category: { label: "同一類", badge: "bg-white/25 text-white" },
  phonetic: { label: "諧音", badge: "bg-white/25 text-white" },
  contextual: { label: "場景", badge: "bg-white/25 text-white" },
  opposite: { label: "相反詞", badge: "bg-white/25 text-white" },
};

// Gradient palette for neighbour cards (cycles)
const GRADIENTS = [
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-lime-400 to-green-500",
  "from-cyan-400 to-blue-400",
  "from-fuchsia-400 to-pink-500",
];

const isImageUrl = (v?: string) =>
  !!v && (v.startsWith("http") || v.startsWith("/"));

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface WordKnowledgeGraphProps {
  graph: WordGraph;
  childId?: string;
  onNodeClick?: (node: WordNode) => void;
  className?: string;
  width?: number;
  height?: number;
}

export function WordKnowledgeGraph({
  graph,
  childId,
  onNodeClick,
  className,
}: WordKnowledgeGraphProps) {
  // Full word details (for images & modal)
  const [wordDetails, setWordDetails] = useState<Map<string, Word>>(new Map());
  // Modal
  const [modalWord, setModalWord] = useState<Word | null>(null);

  // --- Batch-fetch full word details whenever the graph changes ---
  useEffect(() => {
    let cancelled = false;
    const ids = graph.nodes.map((n) => n.word_id);

    Promise.all(
      ids.map((id) =>
        getWord(id)
          .then((r) => toWord(r))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const map = new Map<string, Word>();
      results.forEach((w, i) => {
        if (w) map.set(ids[i], w);
      });
      setWordDetails(map);
    });

    return () => {
      cancelled = true;
    };
  }, [graph]);

  const centreNode = graph.nodes.find(
    (n) => n.word_id === graph.centre_word_id,
  );
  const neighbours = graph.nodes.filter(
    (n) => n.word_id !== graph.centre_word_id,
  );

  // Build centre→neighbour relationship map
  const relMap = new Map<string, RelationshipType>();
  for (const edge of graph.edges) {
    if (edge.source_id === graph.centre_word_id) {
      relMap.set(edge.target_id, edge.relationship_type);
    }
  }

  const openModal = useCallback(
    (node: WordNode) => {
      const full = wordDetails.get(node.word_id);
      if (full) {
        setModalWord(full);
      } else {
        // Fetch on-demand as fallback
        getWord(node.word_id)
          .then((r) => setModalWord(toWord(r)))
          .catch(() => {});
      }
    },
    [wordDetails],
  );

  if (!centreNode) return null;

  const centreWord = wordDetails.get(centreNode.word_id);
  const centreImage = centreWord?.image;

  return (
    <>
      {/* Word detail modal */}
      <WordDetailModal
        word={modalWord}
        onClose={() => setModalWord(null)}
        languagePreference="cantonese"
        childId={childId}
        onProgressUpdate={(wordId, mastered, exposureCount) => {
          setWordDetails((prev) => {
            const updated = new Map(prev);
            const w = updated.get(wordId);
            if (w) updated.set(wordId, { ...w, mastered, exposureCount });
            return updated;
          });
        }}
      />

      <div className={cn("flex flex-col gap-5", className)}>
        {/* ── Centre word hero card ── */}
        <button
          onClick={() => openModal(centreNode)}
          className="relative flex flex-col items-center bg-linear-to-br from-indigo-500 to-violet-600 rounded-3xl px-6 py-7 shadow-md text-white text-center overflow-hidden w-full active:scale-[0.98] transition-transform duration-150"
        >
          {/* decorative blobs */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Word photo */}
          {isImageUrl(centreImage) ? (
            <div className="w-28 h-28 mb-4 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/30 shrink-0">
              <img
                src={centreImage}
                alt={centreNode.word_cantonese || centreNode.word}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : centreWord?.image ? (
            <span className="text-6xl mb-3">{centreWord.image}</span>
          ) : null}

          <p
            className="text-[3.25rem] font-black leading-none tracking-tight"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            {centreNode.word_cantonese || centreNode.word}
          </p>

          {centreNode.jyutping && (
            <p className="mt-2 text-indigo-200 font-semibold text-lg tracking-widest">
              {centreNode.jyutping}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
            {centreNode.mastered && (
              <span className="flex items-center gap-1 bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                已掌握
              </span>
            )}
            <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
              接觸 {centreNode.exposure_count} 次
            </span>
            <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
              點擊查看詳情 →
            </span>
          </div>
        </button>

        {/* ── Section label ── */}
        {neighbours.length > 0 && (
          <p
            className="text-slate-500 font-bold text-sm text-center"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            ✨ 和它相關的詞語
          </p>
        )}

        {/* ── Neighbour cards — 2-column grid ── */}
        {neighbours.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 items-stretch">
            {neighbours.map((node, i) => {
              const rel = relMap.get(node.word_id);
              const relStyle = rel ? REL_STYLES[rel] : REL_STYLES.category;
              const gradient = node.mastered
                ? "from-emerald-400 to-teal-500"
                : GRADIENTS[i % GRADIENTS.length];
              const nodeDetails = wordDetails.get(node.word_id);
              const nodeImage = nodeDetails?.image;

              return (
                <div
                  key={node.word_id}
                  className="relative h-full flex flex-col"
                >
                  {/* Main tap area — opens detail modal only */}
                  <button
                    onClick={() => openModal(node)}
                    className={cn(
                      "flex-1 w-full flex flex-col items-center justify-start gap-1.5",
                      "rounded-3xl px-4 pt-4 pb-5 transition-all duration-200",
                      "active:scale-95 shadow-sm",
                      `bg-linear-to-br ${gradient} text-white`,
                      "hover:scale-[1.02]",
                    )}
                  >
                    {/* Word photo */}
                    {isImageUrl(nodeImage) ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-white/40 shadow mb-1 shrink-0">
                        <img
                          src={nodeImage}
                          alt={node.word_cantonese || node.word}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    ) : nodeDetails?.image ? (
                      <span className="text-4xl mb-1">{nodeDetails.image}</span>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white/20 mb-1 shrink-0" />
                    )}

                    {/* Word */}
                    <span
                      className="text-[2rem] font-black leading-none"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                    >
                      {node.word_cantonese || node.word}
                    </span>

                    {/* Jyutping */}
                    {node.jyutping && (
                      <span className="text-white/80 font-semibold text-sm tracking-widest">
                        {node.jyutping.split(" ")[0]}
                      </span>
                    )}

                    {/* Relationship badge */}
                    {rel && (
                      <span
                        className={cn(
                          "mt-1 text-[11px] font-bold px-3 py-0.5 rounded-full",
                          relStyle.badge,
                        )}
                      >
                        {relStyle.label}
                      </span>
                    )}

                    {/* Mastered star */}
                    {node.mastered && (
                      <Star className="w-4 h-4 fill-yellow-300 text-yellow-300 mt-0.5" />
                    )}
                  </button>

                  {/* Explore button — navigates the graph without opening modal */}
                  {onNodeClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNodeClick(node);
                      }}
                      title="探索此詞的相關詞語"
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center transition-colors active:scale-90"
                    >
                      <Compass className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p
            className="text-slate-400 text-sm text-center py-4"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            暫無相關詞語
          </p>
        )}

        {/* ── Tap hint ── */}
        {neighbours.length > 0 && (
          <p
            className="text-slate-400 text-xs text-center"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            點擊卡片查看詳情 · 點擊
            <Compass className="inline w-3 h-3 mx-0.5 align-middle" />
            探索相關詞語
          </p>
        )}
      </div>
    </>
  );
}

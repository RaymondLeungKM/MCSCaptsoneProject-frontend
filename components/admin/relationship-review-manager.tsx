"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  approvePendingWordRelationship,
  listPendingWordRelationships,
  rejectPendingWordRelationship,
} from "@/lib/api/word-personalization";
import type { RelationshipType, WordRelationshipReviewItem } from "@/lib/types";

type StrengthFilter = "all" | "high" | "medium" | "low";
type SortOption = "newest" | "oldest" | "strongest" | "weakest" | "word";
type ReviewAction = "approve" | "reject";
type ViewMode = "pairs" | "rows";

type GroupedRelationshipItem = {
  key: string;
  pairLabel: string;
  firstLabel: string;
  secondLabel: string;
  itemIds: number[];
  relationshipType: RelationshipType;
  latestCreatedAt: string;
  earliestCreatedAt: string;
  strength: number;
};

const RELATIONSHIP_OPTIONS: Array<{
  value: "all" | RelationshipType;
  label: string;
}> = [
  { value: "all", label: "全部類型" },
  { value: "semantic", label: "semantic" },
  { value: "category", label: "category" },
  { value: "phonetic", label: "phonetic" },
  { value: "contextual", label: "contextual" },
  { value: "opposite", label: "opposite" },
];

const STRENGTH_OPTIONS: Array<{ value: StrengthFilter; label: string }> = [
  { value: "all", label: "全部強度" },
  { value: "high", label: "高信心 0.85+" },
  { value: "medium", label: "中等 0.70-0.84" },
  { value: "low", label: "待觀察 < 0.70" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "最新建立" },
  { value: "oldest", label: "最早建立" },
  { value: "strongest", label: "強度最高" },
  { value: "weakest", label: "強度最低" },
  { value: "word", label: "來源詞彙 A-Z" },
];

const VIEW_MODE_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: "pairs", label: "配對整理" },
  { value: "rows", label: "逐筆檢視" },
];

function formatLabel(
  english?: string,
  cantonese?: string,
  fallback?: string,
): string {
  const en = (english || "").trim();
  const yue = (cantonese || "").trim();

  if (en && yue) {
    return `${en} (${yue})`;
  }
  if (en) {
    return en;
  }
  if (yue) {
    return yue;
  }
  return fallback || "-";
}

function formatCantoneseLabel(cantonese?: string, fallback?: string): string {
  const yue = (cantonese || "").trim();
  return yue || fallback || "-";
}

function toggleIdsInSelection(
  currentIds: number[],
  relationshipIds: number[],
  checked: boolean,
): number[] {
  const currentSet = new Set(currentIds);

  if (checked) {
    relationshipIds.forEach((id) => currentSet.add(id));
    return Array.from(currentSet);
  }

  relationshipIds.forEach((id) => currentSet.delete(id));
  return Array.from(currentSet);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RelationshipReviewManager() {
  const { toast } = useToast();

  const [items, setItems] = useState<WordRelationshipReviewItem[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [batchAction, setBatchAction] = useState<ReviewAction | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState<
    "all" | RelationshipType
  >("all");
  const [strengthFilter, setStrengthFilter] = useState<StrengthFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("pairs");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const hasItems = items.length > 0;
  const hasActiveProcessing = processingIds.length > 0 || isBatchProcessing;

  async function loadPending() {
    setLoading(true);
    setError(null);

    try {
      const response = await listPendingWordRelationships(120);
      setItems(response.items);
      setTotalPending(response.total_pending);
      setSelectedIds([]);
    } catch (loadError) {
      console.error("Failed to load pending AI relationships", loadError);
      setError("未能載入詞彙關係審核清單，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPending();
  }, []);

  function removeItems(relationshipIds: number[]) {
    const idSet = new Set(relationshipIds);
    setItems((current) => current.filter((item) => !idSet.has(item.id)));
    setSelectedIds((current) => current.filter((id) => !idSet.has(id)));
    setTotalPending((current) => Math.max(0, current - relationshipIds.length));
  }

  async function runReviewAction(action: ReviewAction, relationshipId: number) {
    if (action === "approve") {
      await approvePendingWordRelationship(relationshipId);
      return;
    }
    await rejectPendingWordRelationship(relationshipId);
  }

  async function handleActionSet(
    action: ReviewAction,
    relationshipIds: number[],
  ) {
    if (relationshipIds.length === 0) {
      return;
    }

    const targetIds = [...relationshipIds];
    setIsBatchProcessing(true);
    setProcessingIds(targetIds);

    let successCount = 0;
    const succeededIds: number[] = [];

    for (const relationshipId of targetIds) {
      try {
        await runReviewAction(action, relationshipId);
        successCount += 1;
        succeededIds.push(relationshipId);
      } catch (actionError) {
        console.error(`Failed to ${action} relationship`, actionError);
      }
    }

    if (successCount > 0) {
      removeItems(succeededIds);
    }

    if (targetIds.length === 1) {
      if (successCount === 1) {
        toast({
          title: action === "approve" ? "已批准關係" : "已拒絕關係",
          description:
            action === "approve"
              ? "這條 AI 建議關係已保留在知識圖譜中。"
              : "這條 AI 建議關係已從待審核清單移除。",
        });
      } else {
        toast({
          title: action === "approve" ? "批准失敗" : "拒絕失敗",
          description:
            action === "approve"
              ? "未能批准這條關係，請稍後再試。"
              : "未能拒絕這條關係，請稍後再試。",
          variant: "destructive",
        });
      }
    } else if (successCount === targetIds.length) {
      toast({
        title: action === "approve" ? "已批量批准" : "已批量拒絕",
        description: `已完成 ${successCount} 條關係的審核。`,
      });
    } else {
      toast({
        title: successCount > 0 ? "部分完成" : "批次操作失敗",
        description:
          successCount > 0
            ? `成功處理 ${successCount} / ${targetIds.length} 條關係，請重新整理後重試其餘項目。`
            : "未能完成批次操作，請稍後再試。",
        variant: successCount > 0 ? undefined : "destructive",
      });
    }

    setProcessingIds([]);
    setIsBatchProcessing(false);
  }

  async function handleSingleAction(
    action: ReviewAction,
    relationshipId: number,
  ) {
    await handleActionSet(action, [relationshipId]);
  }

  async function handleBatchAction() {
    if (!batchAction || selectedIds.length === 0) {
      return;
    }

    const action = batchAction;
    setBatchAction(null);
    await handleActionSet(action, selectedIds);
  }

  const summaryText = useMemo(() => {
    if (totalPending === 0) {
      return "目前沒有待審核的 AI 關係。";
    }
    return `目前有 ${totalPending} 條 AI 產生關係等待管理員確認。`;
  }, [totalPending]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        if (
          relationshipFilter !== "all" &&
          item.relationship_type !== relationshipFilter
        ) {
          return false;
        }

        if (strengthFilter === "high" && item.strength < 0.85) {
          return false;
        }

        if (
          strengthFilter === "medium" &&
          (item.strength < 0.7 || item.strength >= 0.85)
        ) {
          return false;
        }

        if (strengthFilter === "low" && item.strength >= 0.7) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack = [
          item.word,
          item.word_cantonese,
          item.related_word,
          item.related_word_cantonese,
          item.word_id,
          item.related_word_id,
          item.relationship_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .sort((left, right) => {
        switch (sortBy) {
          case "oldest":
            return (
              new Date(left.created_at).getTime() -
              new Date(right.created_at).getTime()
            );
          case "strongest":
            return right.strength - left.strength;
          case "weakest":
            return left.strength - right.strength;
          case "word": {
            const leftLabel = formatLabel(
              left.word,
              left.word_cantonese,
              left.word_id,
            );
            const rightLabel = formatLabel(
              right.word,
              right.word_cantonese,
              right.word_id,
            );
            return leftLabel.localeCompare(rightLabel, "en");
          }
          case "newest":
          default:
            return (
              new Date(right.created_at).getTime() -
              new Date(left.created_at).getTime()
            );
        }
      });
  }, [items, relationshipFilter, searchQuery, sortBy, strengthFilter]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, GroupedRelationshipItem>();

    filteredItems.forEach((item) => {
      const endpoints = [
        {
          id: item.word_id,
          label: formatCantoneseLabel(item.word_cantonese, item.word_id),
        },
        {
          id: item.related_word_id,
          label: formatCantoneseLabel(
            item.related_word_cantonese,
            item.related_word_id,
          ),
        },
      ].sort((left, right) => left.id.localeCompare(right.id));

      const key = `${endpoints[0].id}::${endpoints[1].id}::${item.relationship_type}`;
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          key,
          pairLabel: `${endpoints[0].label} <-> ${endpoints[1].label}`,
          firstLabel: endpoints[0].label,
          secondLabel: endpoints[1].label,
          itemIds: [item.id],
          relationshipType: item.relationship_type,
          latestCreatedAt: item.created_at,
          earliestCreatedAt: item.created_at,
          strength: item.strength,
        });
        return;
      }

      existing.itemIds.push(item.id);

      if (
        new Date(item.created_at).getTime() >
        new Date(existing.latestCreatedAt).getTime()
      ) {
        existing.latestCreatedAt = item.created_at;
      }

      if (
        new Date(item.created_at).getTime() <
        new Date(existing.earliestCreatedAt).getTime()
      ) {
        existing.earliestCreatedAt = item.created_at;
      }
    });

    return Array.from(groups.values()).sort((left, right) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(left.earliestCreatedAt).getTime() -
            new Date(right.earliestCreatedAt).getTime()
          );
        case "strongest":
          return right.strength - left.strength;
        case "weakest":
          return left.strength - right.strength;
        case "word":
          return left.pairLabel.localeCompare(right.pairLabel, "zh-HK");
        case "newest":
        default:
          return (
            new Date(right.latestCreatedAt).getTime() -
            new Date(left.latestCreatedAt).getTime()
          );
      }
    });
  }, [filteredItems, sortBy]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleIds = useMemo(
    () => filteredItems.map((item) => item.id),
    [filteredItems],
  );
  const selectedVisibleCount = useMemo(
    () => visibleIds.filter((id) => selectedIdSet.has(id)).length,
    [selectedIdSet, visibleIds],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const hasFilteredItems = filteredItems.length > 0;

  function getGroupSelectionState(itemIds: number[]) {
    const selectedCount = itemIds.filter((id) => selectedIdSet.has(id)).length;

    if (selectedCount === 0) {
      return false;
    }

    if (selectedCount === itemIds.length) {
      return true;
    }

    return "indeterminate" as const;
  }

  function toggleSelection(relationshipId: number, checked: boolean) {
    setSelectedIds((current) =>
      toggleIdsInSelection(current, [relationshipId], checked),
    );
  }

  function toggleSelectVisible(checked: boolean) {
    if (!checked) {
      const visibleIdSet = new Set(visibleIds);
      setSelectedIds((current) =>
        current.filter((id) => !visibleIdSet.has(id)),
      );
      return;
    }

    setSelectedIds((current) => {
      return toggleIdsInSelection(current, visibleIds, true);
    });
  }

  function toggleGroupSelection(itemIds: number[], checked: boolean) {
    setSelectedIds((current) =>
      toggleIdsInSelection(current, itemIds, checked),
    );
  }

  function resetFilters() {
    setSearchQuery("");
    setRelationshipFilter("all");
    setStrengthFilter("all");
    setSortBy("newest");
  }

  const visibleCountLabel =
    viewMode === "pairs" ? groupedItems.length : filteredItems.length;

  return (
    <>
      <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
        <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-800">
                詞彙關係審核
              </CardTitle>
              <CardDescription className="mt-1">
                先由系統產生候選詞彙連結，再由管理員決定是否保留，提升知識圖譜品質。
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadPending()}
              disabled={loading || hasActiveProcessing}
              className="h-11 rounded-full border-slate-200 bg-white"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              重新整理
            </Button>
          </div>
          <p className="text-sm font-medium text-slate-600">{summaryText}</p>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {error && (
            <Alert className="mb-4 rounded-3xl border-rose-200 bg-rose-50 text-rose-900">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              正在載入待審核關係...
            </div>
          ) : !hasItems ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              目前沒有待審核關係。
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <Search className="h-3.5 w-3.5" />
                        搜尋
                      </p>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(event.target.value)
                          }
                          placeholder="輸入詞彙、中文或關係類型"
                          className="h-10 rounded-2xl border-slate-200 bg-white pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <Filter className="h-3.5 w-3.5" />
                        關係類型
                      </p>
                      <Select
                        value={relationshipFilter}
                        onValueChange={(value) =>
                          setRelationshipFilter(
                            value as "all" | RelationshipType,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200 bg-white">
                          <SelectValue placeholder="選擇關係類型" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        信心分層
                      </p>
                      <Select
                        value={strengthFilter}
                        onValueChange={(value) =>
                          setStrengthFilter(value as StrengthFilter)
                        }
                      >
                        <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200 bg-white">
                          <SelectValue placeholder="選擇強度範圍" />
                        </SelectTrigger>
                        <SelectContent>
                          {STRENGTH_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        排序方式
                      </p>
                      <Select
                        value={sortBy}
                        onValueChange={(value) =>
                          setSortBy(value as SortOption)
                        }
                      >
                        <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200 bg-white">
                          <SelectValue placeholder="選擇排序方式" />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        檢視模式
                      </p>
                      <Select
                        value={viewMode}
                        onValueChange={(value) =>
                          setViewMode(value as ViewMode)
                        }
                      >
                        <SelectTrigger className="h-10 w-full rounded-2xl border-slate-200 bg-white">
                          <SelectValue placeholder="選擇檢視方式" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIEW_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <Badge className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-900">
                      可見 {visibleCountLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-slate-300 bg-white px-3 py-1 text-slate-700"
                    >
                      已選 {selectedIds.length}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="h-9 rounded-full border-slate-200 bg-white px-4"
                    >
                      重設篩選
                    </Button>
                  </div>
                </div>
              </div>

              <div className="sticky top-0 z-10 rounded-3xl border border-emerald-100 bg-emerald-50/95 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-900">
                    <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      批次審核
                    </Badge>
                    <span className="font-semibold">
                      已選 {selectedIds.length} 項，正在顯示 {visibleCountLabel}{" "}
                      {viewMode === "pairs" ? "組" : "項"}。
                    </span>
                    {selectedVisibleCount > 0 &&
                    selectedVisibleCount !== selectedIds.length ? (
                      <span className="text-emerald-800/80">
                        其中 {selectedVisibleCount} 項屬於目前篩選結果。
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSelectVisible(!allVisibleSelected)}
                      disabled={!hasFilteredItems || hasActiveProcessing}
                      className="h-9 rounded-full border-emerald-200 bg-white px-4 text-emerald-800 hover:bg-emerald-100"
                    >
                      {allVisibleSelected
                        ? "取消目前可見項目"
                        : "全選目前可見項目"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      disabled={selectedIds.length === 0 || hasActiveProcessing}
                      className="h-9 rounded-full border-slate-200 bg-white px-4"
                    >
                      清除選取
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setBatchAction("approve")}
                      disabled={selectedIds.length === 0 || hasActiveProcessing}
                      className="h-9 rounded-full bg-emerald-600 px-4 text-white hover:bg-emerald-500"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      批量批准
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setBatchAction("reject")}
                      disabled={selectedIds.length === 0 || hasActiveProcessing}
                      className="h-9 rounded-full border-rose-200 bg-white px-4 text-rose-700 hover:bg-rose-50"
                    >
                      <X className="mr-1 h-4 w-4" />
                      批量拒絕
                    </Button>
                  </div>
                </div>
              </div>

              {!hasFilteredItems ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-500">
                  目前篩選條件下沒有結果，請調整搜尋或篩選設定。
                </div>
              ) : (
                <div className="max-h-120 overflow-y-auto rounded-3xl border border-slate-100">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              allVisibleSelected
                                ? true
                                : selectedVisibleCount > 0
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={(checked) =>
                              toggleSelectVisible(checked === true)
                            }
                            disabled={!hasFilteredItems || hasActiveProcessing}
                            aria-label="Select visible relationships"
                          />
                        </TableHead>
                        {viewMode === "pairs" ? (
                          <>
                            <TableHead>詞彙配對</TableHead>
                            <TableHead>關係類型</TableHead>
                            <TableHead>記錄數</TableHead>
                            <TableHead>強度</TableHead>
                            <TableHead>建立時間</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>來源詞彙</TableHead>
                            <TableHead>建議連結</TableHead>
                            <TableHead>關係類型</TableHead>
                            <TableHead>強度</TableHead>
                            <TableHead>建立時間</TableHead>
                          </>
                        )}
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewMode === "pairs"
                        ? groupedItems.map((group) => {
                            const busy = group.itemIds.some((id) =>
                              processingIds.includes(id),
                            );

                            return (
                              <TableRow key={group.key}>
                                <TableCell>
                                  <Checkbox
                                    checked={getGroupSelectionState(
                                      group.itemIds,
                                    )}
                                    onCheckedChange={(checked) =>
                                      toggleGroupSelection(
                                        group.itemIds,
                                        checked === true,
                                      )
                                    }
                                    disabled={hasActiveProcessing}
                                    aria-label={`Select relationship group ${group.key}`}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-slate-800">
                                      {group.firstLabel}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                      {group.secondLabel}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {group.relationshipType}
                                  </span>
                                </TableCell>
                                <TableCell className="font-bold text-slate-700">
                                  {group.itemIds.length}
                                </TableCell>
                                <TableCell className="font-bold text-slate-700">
                                  {group.strength.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-slate-500">
                                  {formatDate(group.latestCreatedAt)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        void handleActionSet(
                                          "approve",
                                          group.itemIds,
                                        )
                                      }
                                      disabled={hasActiveProcessing}
                                      className="h-8 rounded-full bg-emerald-600 px-3 text-white hover:bg-emerald-500"
                                    >
                                      {busy ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                      <span className="ml-1">批准整組</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        void handleActionSet(
                                          "reject",
                                          group.itemIds,
                                        )
                                      }
                                      disabled={hasActiveProcessing}
                                      className="h-8 rounded-full border-rose-200 bg-rose-50 px-3 text-rose-700 hover:bg-rose-100"
                                    >
                                      {busy ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                      <span className="ml-1">拒絕整組</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        : filteredItems.map((item) => {
                            const busy = processingIds.includes(item.id);

                            return (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedIdSet.has(item.id)}
                                    onCheckedChange={(checked) =>
                                      toggleSelection(item.id, checked === true)
                                    }
                                    disabled={hasActiveProcessing}
                                    aria-label={`Select relationship ${item.id}`}
                                  />
                                </TableCell>
                                <TableCell className="font-semibold text-slate-800">
                                  {formatCantoneseLabel(
                                    item.word_cantonese,
                                    item.word_id,
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold text-slate-700">
                                  {formatCantoneseLabel(
                                    item.related_word_cantonese,
                                    item.related_word_id,
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {item.relationship_type}
                                  </span>
                                </TableCell>
                                <TableCell className="font-bold text-slate-700">
                                  {item.strength.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-slate-500">
                                  {formatDate(item.created_at)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        void handleSingleAction(
                                          "approve",
                                          item.id,
                                        )
                                      }
                                      disabled={hasActiveProcessing}
                                      className="h-8 rounded-full bg-emerald-600 px-3 text-white hover:bg-emerald-500"
                                    >
                                      {busy ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                      <span className="ml-1">批准</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        void handleSingleAction(
                                          "reject",
                                          item.id,
                                        )
                                      }
                                      disabled={hasActiveProcessing}
                                      className="h-8 rounded-full border-rose-200 bg-rose-50 px-3 text-rose-700 hover:bg-rose-100"
                                    >
                                      {busy ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                      <span className="ml-1">拒絕</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={batchAction !== null}
        onOpenChange={(open) => !open && setBatchAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {batchAction === "approve" ? "確認批量批准" : "確認批量拒絕"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {batchAction === "approve"
                ? `即將批准 ${selectedIds.length} 條 AI 建議關係，保留到知識圖譜中。`
                : `即將拒絕 ${selectedIds.length} 條 AI 建議關係，並從待審核清單移除。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleBatchAction();
              }}
              className={
                batchAction === "approve"
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-rose-600 text-white hover:bg-rose-500"
              }
            >
              {isBatchProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : batchAction === "approve" ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              {batchAction === "approve" ? "確認批准" : "確認拒絕"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

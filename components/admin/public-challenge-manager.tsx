"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trophy,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminChallenge,
  listAdminChallenges,
  updateAdminChallenge,
  type ChallengeStatus,
  type CommunityChallenge,
  type CommunityChallengeMutationRequest,
} from "@/lib/api/community";
import { cn } from "@/lib/utils";

type ChallengeFormState = {
  id: string | null;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  targetCount: string;
  category: string;
  emoji: string;
  status: ChallengeStatus;
  startsAt: string;
  endsAt: string;
};

const STATUS_OPTIONS: Array<{ value: ChallengeStatus; label: string }> = [
  { value: "active", label: "進行中" },
  { value: "completed", label: "已完成" },
  { value: "expired", label: "已過期" },
];

function toDateTimeLocalValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function createDefaultDateTimeLocal(offsetDays: number): string {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(0);
  date.setHours(date.getHours() + 1);
  date.setDate(date.getDate() + offsetDays);
  return toDateTimeLocalValue(date);
}

function createEmptyChallengeForm(): ChallengeFormState {
  return {
    id: null,
    title: "",
    titleZh: "",
    description: "",
    descriptionZh: "",
    targetCount: "5",
    category: "",
    emoji: "🏆",
    status: "active",
    startsAt: createDefaultDateTimeLocal(0),
    endsAt: createDefaultDateTimeLocal(7),
  };
}

function challengeToForm(challenge: CommunityChallenge): ChallengeFormState {
  return {
    id: challenge.id,
    title: challenge.title,
    titleZh: challenge.title_zh ?? "",
    description: challenge.description ?? "",
    descriptionZh: challenge.description_zh ?? "",
    targetCount: String(challenge.target_count),
    category: challenge.category ?? "",
    emoji: challenge.emoji || "🏆",
    status: challenge.status,
    startsAt: toDateTimeLocalValue(new Date(challenge.starts_at)),
    endsAt: toDateTimeLocalValue(new Date(challenge.ends_at)),
  };
}

function toIsoDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("請輸入有效的開始及結束時間。");
  }
  return parsed.toISOString();
}

function buildChallengePayload(
  form: ChallengeFormState,
): CommunityChallengeMutationRequest {
  const title = form.title.trim();
  if (!title) {
    throw new Error("請輸入挑戰名稱。");
  }

  const startsAt = toIsoDateTime(form.startsAt);
  const endsAt = toIsoDateTime(form.endsAt);
  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new Error("結束時間必須晚於開始時間。");
  }

  const targetCount = Number(form.targetCount);
  if (!Number.isFinite(targetCount) || targetCount < 1) {
    throw new Error("目標次數必須至少為 1。");
  }

  return {
    title,
    title_zh: form.titleZh.trim() || null,
    description: form.description.trim() || null,
    description_zh: form.descriptionZh.trim() || null,
    target_count: Math.round(targetCount),
    category: form.category.trim() || null,
    emoji: form.emoji.trim() || "🏆",
    status: form.status,
    starts_at: startsAt,
    ends_at: endsAt,
  };
}

function formatChallengeWindow(challenge: CommunityChallenge): string {
  const formatter = new Intl.DateTimeFormat("zh-HK", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(challenge.starts_at))} - ${formatter.format(
    new Date(challenge.ends_at),
  )}`;
}

function getStatusLabel(status: ChallengeStatus): string {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "進行中"
  );
}

function getStatusBadgeClassName(status: ChallengeStatus): string {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "expired") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

export function PublicChallengeManager() {
  const { toast } = useToast();

  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<ChallengeFormState>(createEmptyChallengeForm());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ChallengeStatus>(
    "all",
  );

  useEffect(() => {
    void loadChallenges();
  }, []);

  async function loadChallenges(nextSelectedChallengeId?: string | null) {
    setLoading(true);
    setError(null);

    try {
      const catalog = await listAdminChallenges();
      setChallenges(catalog);

      const targetChallengeId =
        nextSelectedChallengeId ??
        selectedChallengeId ??
        catalog[0]?.id ??
        null;
      setSelectedChallengeId(targetChallengeId);

      const selectedChallenge = catalog.find(
        (challenge) => challenge.id === targetChallengeId,
      );
      setForm(
        selectedChallenge
          ? challengeToForm(selectedChallenge)
          : createEmptyChallengeForm(),
      );
    } catch (loadError) {
      console.error("Failed to load admin challenges:", loadError);
      setError("未能載入公共挑戰，請確認你正使用管理員帳號。");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectChallenge(challenge: CommunityChallenge) {
    setSelectedChallengeId(challenge.id);
    setForm(challengeToForm(challenge));
    setIsDialogOpen(true);
  }

  function handleCreateNew() {
    setSelectedChallengeId(null);
    setForm(createEmptyChallengeForm());
    setIsDialogOpen(true);
  }

  function updateForm<K extends keyof ChallengeFormState>(
    key: K,
    value: ChallengeFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      const payload = buildChallengePayload(form);
      const savedChallenge = selectedChallengeId
        ? await updateAdminChallenge(selectedChallengeId, payload)
        : await createAdminChallenge(payload);

      await loadChallenges(savedChallenge.id);
      setIsDialogOpen(false);
      toast({
        title: selectedChallengeId ? "公共挑戰已更新" : "公共挑戰已建立",
        description: `${savedChallenge.title} 已儲存並同步到公共挑戰目錄。`,
      });
    } catch (saveError) {
      console.error("Failed to save public challenge:", saveError);
      toast({
        title: "儲存失敗",
        description:
          saveError instanceof Error && saveError.message
            ? saveError.message
            : "請檢查挑戰內容後再試。",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const filteredChallenges = challenges.filter((challenge) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesStatus =
      statusFilter === "all" || challenge.status === statusFilter;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      challenge.title.toLowerCase().includes(normalizedQuery) ||
      (challenge.title_zh ?? "").toLowerCase().includes(normalizedQuery) ||
      (challenge.category ?? "").toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });

  const activeCount = challenges.filter(
    (challenge) => challenge.status === "active",
  ).length;
  const completedCount = challenges.filter(
    (challenge) => challenge.status === "completed",
  ).length;
  const expiredCount = challenges.filter(
    (challenge) => challenge.status === "expired",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-none bg-slate-900 text-white shadow-sm">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
                公共挑戰
              </p>
              <p className="mt-3 text-3xl font-black">{challenges.length}</p>
            </div>
            <Trophy className="h-10 w-10 text-amber-300" />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-none bg-amber-50 shadow-sm">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700/70">
                進行中
              </p>
              <p className="mt-3 text-3xl font-black text-amber-700">
                {activeCount}
              </p>
            </div>
            <CalendarDays className="h-10 w-10 text-amber-500" />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-none bg-emerald-50 shadow-sm">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700/70">
                已完成 / 已過期
              </p>
              <p className="mt-3 text-3xl font-black text-emerald-700">
                {completedCount + expiredCount}
              </p>
            </div>
            <Trophy className="h-10 w-10 text-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="rounded-3xl border-amber-200 bg-amber-50 text-amber-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
        <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-800">
                公共挑戰目錄
              </CardTitle>
              <CardDescription className="mt-1">
                管理會顯示在家長社交頁面的公共挑戰。只有狀態為「進行中」且時間落在開始與結束之間的挑戰會對家長可見。
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadChallenges()}
                disabled={loading}
                className="h-11 rounded-full border-slate-200 bg-white px-5 font-bold text-slate-700 hover:bg-slate-50"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                重新整理
              </Button>

              <Button
                type="button"
                onClick={handleCreateNew}
                className="h-11 rounded-full bg-amber-500 px-5 font-bold text-white hover:bg-amber-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增公共挑戰
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr,180px]">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋挑戰名稱或分類"
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | ChallengeStatus)
              }
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="全部狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              正在載入公共挑戰...
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              目前沒有符合條件的公共挑戰。
            </div>
          ) : (
            <div className="max-h-155 overflow-y-auto rounded-3xl border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>挑戰名稱</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>目標次數</TableHead>
                    <TableHead>時間區間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChallenges.map((challenge) => {
                    const isSelected = challenge.id === selectedChallengeId;

                    return (
                      <TableRow
                        key={challenge.id}
                        onClick={() => handleSelectChallenge(challenge)}
                        className={cn(
                          "cursor-pointer",
                          isSelected && "bg-amber-50 hover:bg-amber-50",
                        )}
                      >
                        <TableCell className="max-w-90 whitespace-normal py-4">
                          <div>
                            <p className="font-black text-slate-800">
                              {challenge.emoji} {challenge.title}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {challenge.title_zh || challenge.category || "未設定中文標題"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-bold",
                              getStatusBadgeClassName(challenge.status),
                            )}
                          >
                            {getStatusLabel(challenge.status)}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-slate-600">
                          {challenge.target_count}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-500">
                          {formatChallengeWindow(challenge)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[36px] border-none bg-white p-0 shadow-2xl sm:max-w-3xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left sm:px-8">
            <DialogTitle className="text-2xl font-black text-slate-800">
              {selectedChallengeId ? "編輯公共挑戰" : "建立公共挑戰"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              儲存後，符合時間區間且狀態為進行中的挑戰會出現在家長社交頁面的挑戰區塊。
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable] sm:px-8">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[1fr,120px]">
                <div className="space-y-2">
                  <Label htmlFor="challenge-title">英文標題</Label>
                  <Input
                    id="challenge-title"
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenge-emoji">Emoji</Label>
                  <Input
                    id="challenge-emoji"
                    value={form.emoji}
                    onChange={(event) =>
                      updateForm("emoji", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200 text-center text-lg"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenge-title-zh">中文標題</Label>
                <Input
                  id="challenge-title-zh"
                  value={form.titleZh}
                  onChange={(event) =>
                    updateForm("titleZh", event.target.value)
                  }
                  className="h-11 rounded-2xl border-slate-200"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="challenge-description">英文描述</Label>
                  <Textarea
                    id="challenge-description"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    className="min-h-24 rounded-2xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="challenge-description-zh">中文描述</Label>
                  <Textarea
                    id="challenge-description-zh"
                    value={form.descriptionZh}
                    onChange={(event) =>
                      updateForm("descriptionZh", event.target.value)
                    }
                    className="min-h-24 rounded-2xl border-slate-200"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="challenge-target-count">目標次數</Label>
                  <Input
                    id="challenge-target-count"
                    type="number"
                    min={1}
                    value={form.targetCount}
                    onChange={(event) =>
                      updateForm("targetCount", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenge-category">分類</Label>
                  <Input
                    id="challenge-category"
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    placeholder="例如 speaking"
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>狀態</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      updateForm("status", value as ChallengeStatus)
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="challenge-starts-at">開始時間</Label>
                  <Input
                    id="challenge-starts-at"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) =>
                      updateForm("startsAt", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenge-ends-at">結束時間</Label>
                  <Input
                    id="challenge-ends-at"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(event) =>
                      updateForm("endsAt", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                挑戰會在家長端顯示的條件：狀態為「進行中」，且目前時間已到開始時間並未超過結束時間。
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateNew}
                  className="h-11 rounded-full border-slate-200 bg-white px-5 font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  清空表單
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="h-11 rounded-full bg-emerald-500 px-5 font-bold text-white hover:bg-emerald-400"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {selectedChallengeId ? "儲存修改" : "建立挑戰"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
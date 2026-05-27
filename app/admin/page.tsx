"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Tags,
  Target,
  Trophy,
} from "lucide-react";

import CozyPageWrapper from "@/components/CozyPageWrapper";
import { CategoryManager } from "@/components/admin/category-manager";
import { PublicChallengeManager } from "@/components/admin/public-challenge-manager";
import { LoginCard } from "@/components/auth/login-card";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { VocabularyManager } from "@/components/admin/vocabulary-manager";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  createAdminMission,
  listAdminMissions,
  updateAdminMission,
  type MissionContext,
  type MissionMutationRequest,
  type MissionResponse,
  type MissionStatus,
  type MissionSurface,
} from "@/lib/api/missions";
import { cn } from "@/lib/utils";

type MissionFormState = {
  id: string | null;
  slug: string;
  title: string;
  description: string;
  context: MissionContext;
  isOffline: boolean;
  status: MissionStatus;
  locale: string;
  ageMin: string;
  ageMax: string;
  difficulty: string;
  surface: MissionSurface;
  sortOrder: string;
  selectionTags: string;
  targetWords: string;
  conversationPrompts: string;
  catalogMetadata: string;
  isActive: boolean;
};

const STATUS_OPTIONS: Array<{ value: MissionStatus; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已發佈" },
  { value: "archived", label: "已封存" },
];

const SURFACE_OPTIONS: Array<{ value: MissionSurface; label: string }> = [
  { value: "parent", label: "家長介面" },
  { value: "child", label: "小朋友介面" },
  { value: "both", label: "兩個介面" },
];

const CONTEXT_OPTIONS: Array<{ value: MissionContext; label: string }> = [
  { value: "general", label: "日常對話" },
  { value: "mealtime", label: "用餐時間" },
  { value: "bedtime", label: "睡前時光" },
  { value: "playtime", label: "遊戲時間" },
  { value: "outdoor", label: "戶外活動" },
  { value: "shopping", label: "購物情境" },
];

const MISSION_DIFFICULTY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "easy", label: "簡單" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困難" },
];

function normalizeMissionDifficulty(value?: string | null): string {
  return MISSION_DIFFICULTY_OPTIONS.some((option) => option.value === value)
    ? value!
    : "";
}

function createEmptyMissionForm(): MissionFormState {
  return {
    id: null,
    slug: "",
    title: "",
    description: "",
    context: "general",
    isOffline: true,
    status: "draft",
    locale: "zh-HK",
    ageMin: "",
    ageMax: "",
    difficulty: "",
    surface: "parent",
    sortOrder: "0",
    selectionTags: "",
    targetWords: "",
    conversationPrompts: "",
    catalogMetadata: "",
    isActive: true,
  };
}

function missionToForm(mission: MissionResponse): MissionFormState {
  return {
    id: mission.id,
    slug: mission.slug,
    title: mission.title,
    description: mission.description,
    context: mission.context,
    isOffline: mission.is_offline,
    status: mission.status ?? "draft",
    locale: "zh-HK",
    ageMin: mission.age_min?.toString() ?? "",
    ageMax: mission.age_max?.toString() ?? "",
    difficulty: normalizeMissionDifficulty(mission.difficulty),
    surface: mission.surface ?? "parent",
    sortOrder: String(mission.sort_order ?? 0),
    selectionTags: (mission.selection_tags ?? []).join(", "),
    targetWords: (mission.target_words ?? []).join("\n"),
    conversationPrompts: (mission.conversation_prompts ?? []).join("\n"),
    catalogMetadata: mission.catalog_metadata
      ? JSON.stringify(mission.catalog_metadata, null, 2)
      : "",
    isActive: mission.is_active,
  };
}

function parseListInput(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildMissionPayload(form: MissionFormState): MissionMutationRequest {
  let parsedMetadata: Record<string, unknown> | null = null;

  if (form.catalogMetadata.trim()) {
    parsedMetadata = JSON.parse(form.catalogMetadata) as Record<
      string,
      unknown
    >;
  }

  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    description: form.description.trim(),
    context: form.context,
    is_offline: form.isOffline,
    status: form.status,
    locale: "zh-HK",
    age_min: form.ageMin ? Number(form.ageMin) : null,
    age_max: form.ageMax ? Number(form.ageMax) : null,
    difficulty: form.difficulty.trim() || null,
    surface: form.surface,
    sort_order: Number(form.sortOrder || 0),
    selection_tags: parseListInput(form.selectionTags),
    catalog_metadata: parsedMetadata,
    target_words: parseListInput(form.targetWords),
    conversation_prompts: parseListInput(form.conversationPrompts),
    is_active: form.isActive,
  };
}

function getStatusLabel(status: MissionStatus | undefined): string {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "草稿"
  );
}

function getSurfaceLabel(surface: MissionSurface | undefined): string {
  return (
    SURFACE_OPTIONS.find((option) => option.value === surface)?.label ??
    "家長介面"
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("missions");
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
  const [missions, setMissions] = useState<MissionResponse[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<MissionFormState>(createEmptyMissionForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MissionStatus>(
    "all",
  );
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }

    void loadMissions();
  }, [user]);

  async function loadMissions(nextSelectedMissionId?: string | null) {
    setLoading(true);
    setError(null);

    try {
      const catalog = await listAdminMissions(true);
      setMissions(catalog);

      const targetMissionId =
        nextSelectedMissionId ?? selectedMissionId ?? catalog[0]?.id ?? null;
      setSelectedMissionId(targetMissionId);

      const selectedMission = catalog.find(
        (mission) => mission.id === targetMissionId,
      );
      setForm(
        selectedMission
          ? missionToForm(selectedMission)
          : createEmptyMissionForm(),
      );
    } catch (loadError) {
      console.error("Failed to load admin missions:", loadError);
      setError("未能載入任務目錄，請確認你正使用管理員帳號。 ");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectMission(mission: MissionResponse) {
    setSelectedMissionId(mission.id);
    setForm(missionToForm(mission));
    setIsMissionDialogOpen(true);
  }

  function handleCreateNew() {
    setSelectedMissionId(null);
    setForm(createEmptyMissionForm());
    setIsMissionDialogOpen(true);
  }

  function updateForm<K extends keyof MissionFormState>(
    key: K,
    value: MissionFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      const payload = buildMissionPayload(form);
      let savedMission: MissionResponse;

      if (selectedMissionId) {
        savedMission = await updateAdminMission(selectedMissionId, payload);
      } else {
        savedMission = await createAdminMission(payload);
      }

      await loadMissions(savedMission.id);
      setIsMissionDialogOpen(false);
      toast({
        title: selectedMissionId ? "任務已更新" : "任務已建立",
        description: `${savedMission.title} 已儲存到任務目錄。`,
      });
    } catch (saveError) {
      console.error("Failed to save mission:", saveError);
      const description =
        saveError instanceof Error && saveError.message
          ? saveError.message
          : "請檢查欄位內容後再試。";
      toast({
        title: "儲存失敗",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const filteredMissions = missions.filter((mission) => {
    const matchesStatus =
      statusFilter === "all" || mission.status === statusFilter;
    const matchesQuery =
      searchQuery.trim().length === 0 ||
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.slug.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesQuery;
  });

  const draftCount = missions.filter(
    (mission) => mission.status === "draft",
  ).length;
  const publishedCount = missions.filter(
    (mission) => mission.status === "published",
  ).length;
  const archivedCount = missions.filter(
    (mission) => mission.status === "archived",
  ).length;

  if (authLoading) {
    return (
      <CozyPageWrapper type="dashboard" hideThemeToggle>
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <Card className="rounded-4xl border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
            <CardContent className="flex items-center justify-center gap-3 py-12 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              正在驗證管理員身份...
            </CardContent>
          </Card>
        </div>
      </CozyPageWrapper>
    );
  }

  if (!user) {
    return (
      <CozyPageWrapper type="dashboard" hideThemeToggle>
        <div className="container mx-auto flex max-w-4xl justify-center px-4 py-8">
          <LoginCard
            redirectTo="/admin"
            title="登入管理後台"
            description="尚未找到登入資訊。請直接使用管理員帳號登入。"
            submitLabel="登入後台"
            showRegisterLink={false}
          />
        </div>
      </CozyPageWrapper>
    );
  }

  if (user.role !== "admin") {
    return (
      <CozyPageWrapper type="dashboard" hideThemeToggle>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card className="rounded-4xl border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
            <CardContent className="space-y-4 py-10 text-center">
              <Shield className="mx-auto h-10 w-10 text-rose-400" />
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-800">
                  沒有管理員權限
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  目前帳號角色為 {user.role}，需要 `admin`
                  角色才能使用內容管理後台。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CozyPageWrapper>
    );
  }

  return (
    <CozyPageWrapper type="dashboard" hideThemeToggle>
      <div className="container mx-auto max-w-7xl px-4 py-8 pb-24">
        <div className="mb-6 overflow-hidden rounded-[36px] border border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
          <div className="bg-linear-to-r from-amber-100 via-orange-50 to-sky-100 px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-slate-500 shadow-sm">
                  <Shield className="h-3.5 w-3.5 text-orange-500" />
                  Admin Console
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-800 md:text-4xl">
                    內容管理後台
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 md:text-base">
                    目前已可在同一後台管理任務目錄、公共挑戰、共用詞彙與主題分類，後續再逐步加入更多內容編輯工具。
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => void loadMissions()}
                disabled={loading}
                className="h-11 rounded-full bg-slate-800 px-5 font-bold text-white hover:bg-slate-700"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                重新整理
              </Button>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/70 bg-white/70 px-6 py-5 md:grid-cols-3 md:px-8">
            <Card className="rounded-[28px] border-none bg-slate-900 text-white shadow-sm">
              <CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
                    任務目錄
                  </p>
                  <p className="mt-3 text-3xl font-black">{missions.length}</p>
                </div>
                <Target className="h-10 w-10 text-amber-300" />
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-none bg-emerald-50 shadow-sm">
              <CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600/70">
                    已發佈
                  </p>
                  <p className="mt-3 text-3xl font-black text-emerald-700">
                    {publishedCount}
                  </p>
                </div>
                <Sparkles className="h-10 w-10 text-emerald-500" />
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-none bg-amber-50 shadow-sm">
              <CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-600/70">
                    草稿 / 封存
                  </p>
                  <p className="mt-3 text-3xl font-black text-amber-700">
                    {draftCount + archivedCount}
                  </p>
                </div>
                <Tags className="h-10 w-10 text-amber-500" />
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 rounded-3xl border-amber-200 bg-amber-50 text-amber-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-sm backdrop-blur-md">
            <div className="border-b border-white/60 px-5 py-4 md:px-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                管理區塊
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                將任務、公共挑戰、共用詞彙與主題分類分開管理；新增或編輯時會以彈出視窗顯示表單。
              </p>
            </div>

            <div className="overflow-x-auto px-3 py-3 md:px-4">
              <TabsList className="flex h-auto w-full flex-col gap-2 bg-transparent p-0 md:flex-row">
                <TabsTrigger
                  value="missions"
                  className="justify-start gap-3 rounded-[24px] border border-orange-100 bg-white/80 px-4 py-3 text-left data-[state=active]:border-orange-200 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none"
                >
                  <Target className="h-4 w-4" />
                  <span className="font-black">任務目錄</span>
                </TabsTrigger>
                <TabsTrigger
                  value="challenges"
                  className="justify-start gap-3 rounded-[24px] border border-amber-100 bg-white/80 px-4 py-3 text-left data-[state=active]:border-amber-200 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-none"
                >
                  <Trophy className="h-4 w-4" />
                  <span className="font-black">公共挑戰</span>
                </TabsTrigger>
                <TabsTrigger
                  value="vocabulary"
                  className="justify-start gap-3 rounded-[24px] border border-sky-100 bg-white/80 px-4 py-3 text-left data-[state=active]:border-sky-200 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:shadow-none"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="font-black">精選中文詞彙</span>
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="justify-start gap-3 rounded-[24px] border border-violet-100 bg-white/80 px-4 py-3 text-left data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none"
                >
                  <Tags className="h-4 w-4" />
                  <span className="font-black">主題與分類</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="missions" className="mt-0">
            <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
              <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800">
                      任務清單
                    </CardTitle>
                    <CardDescription className="mt-1">
                      搜尋、檢視及點擊任務，即可在彈出視窗中編輯 mission
                      catalog。
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateNew}
                    className="h-11 rounded-full bg-orange-500 px-5 font-bold text-white hover:bg-orange-400"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    新增任務
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,180px]">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="搜尋標題或 slug"
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                  />
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as "all" | MissionStatus)
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
                    正在載入任務目錄...
                  </div>
                ) : filteredMissions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
                    目前沒有符合條件的任務。
                  </div>
                ) : (
                  <div className="max-h-155 overflow-y-auto rounded-3xl border border-slate-100">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>標題</TableHead>
                          <TableHead>狀態</TableHead>
                          <TableHead>介面</TableHead>
                          <TableHead>排序</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMissions.map((mission) => {
                          const isSelected = mission.id === selectedMissionId;

                          return (
                            <TableRow
                              key={mission.id}
                              onClick={() => handleSelectMission(mission)}
                              className={cn(
                                "cursor-pointer",
                                isSelected && "bg-orange-50 hover:bg-orange-50",
                              )}
                            >
                              <TableCell className="max-w-75 whitespace-normal py-4">
                                <div>
                                  <p className="font-black text-slate-800">
                                    {mission.title}
                                  </p>
                                  <p className="mt-1 text-xs font-medium text-slate-500">
                                    /{mission.slug}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                  {getStatusLabel(mission.status)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                                  {getSurfaceLabel(mission.surface)}
                                </span>
                              </TableCell>
                              <TableCell className="font-bold text-slate-600">
                                {mission.sort_order ?? 0}
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
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <PublicChallengeManager />
          </TabsContent>

          <TabsContent value="vocabulary" className="mt-0">
            <VocabularyManager refreshKey={categoryRefreshKey} />
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <CategoryManager
              onCategoriesChanged={() =>
                setCategoryRefreshKey((current) => current + 1)
              }
            />
          </TabsContent>
        </Tabs>

        <Dialog
          open={isMissionDialogOpen}
          onOpenChange={setIsMissionDialogOpen}
        >
          <DialogContent className="rounded-[36px] border-none bg-white p-0 shadow-2xl sm:max-w-4xl">
            <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left sm:px-8">
              <DialogTitle className="text-2xl font-black text-slate-800">
                {selectedMissionId ? "編輯任務" : "建立新任務"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                編輯 catalog 欄位後即可影響後續任務分派與家長介面顯示。
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable] sm:px-8">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mission-title">標題</Label>
                    <Input
                      id="mission-title"
                      value={form.title}
                      onChange={(event) =>
                        updateForm("title", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mission-slug">Slug</Label>
                    <Input
                      id="mission-slug"
                      value={form.slug}
                      onChange={(event) =>
                        updateForm("slug", event.target.value)
                      }
                      placeholder="mealtime-name-game"
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mission-description">描述</Label>
                  <Textarea
                    id="mission-description"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    className="min-h-24 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>情境</Label>
                    <Select
                      value={form.context}
                      onValueChange={(value) =>
                        updateForm("context", value as MissionContext)
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTEXT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>狀態</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        updateForm("status", value as MissionStatus)
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
                    <Label>顯示介面</Label>
                    <Select
                      value={form.surface}
                      onValueChange={(value) =>
                        updateForm("surface", value as MissionSurface)
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SURFACE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mission-locale">Locale</Label>
                    <div className="relative">
                      <Input
                        id="mission-locale"
                        value="zh-HK"
                        readOnly
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50 pr-11 text-slate-500"
                      />
                      <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                      目前任務語系固定為 zh-HK。
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="age-min">最低年齡</Label>
                    <Input
                      id="age-min"
                      type="number"
                      min={0}
                      value={form.ageMin}
                      onChange={(event) =>
                        updateForm("ageMin", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age-max">最高年齡</Label>
                    <Input
                      id="age-max"
                      type="number"
                      min={0}
                      value={form.ageMax}
                      onChange={(event) =>
                        updateForm("ageMax", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort-order">排序</Label>
                    <Input
                      id="sort-order"
                      type="number"
                      value={form.sortOrder}
                      onChange={(event) =>
                        updateForm("sortOrder", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">難度標籤</Label>
                  <Select
                    value={form.difficulty || "unset"}
                    onValueChange={(value) =>
                      updateForm("difficulty", value === "unset" ? "" : value)
                    }
                  >
                    <SelectTrigger
                      id="difficulty"
                      className="h-11 w-full rounded-2xl border-slate-200"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">未設定</SelectItem>
                      {MISSION_DIFFICULTY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target-words">目標詞彙</Label>
                    <Textarea
                      id="target-words"
                      value={form.targetWords}
                      onChange={(event) =>
                        updateForm("targetWords", event.target.value)
                      }
                      placeholder="每行一個詞彙，或使用逗號分隔"
                      className="min-h-28 rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conversation-prompts">對話提示</Label>
                    <Textarea
                      id="conversation-prompts"
                      value={form.conversationPrompts}
                      onChange={(event) =>
                        updateForm("conversationPrompts", event.target.value)
                      }
                      placeholder="每行一條提示句"
                      className="min-h-28 rounded-2xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selection-tags">選擇標籤</Label>
                  <Input
                    id="selection-tags"
                    value={form.selectionTags}
                    onChange={(event) =>
                      updateForm("selectionTags", event.target.value)
                    }
                    placeholder="例如: family, routine, speaking"
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-700">
                        家長帶領實境任務
                      </p>
                      <p className="text-xs text-slate-500">
                        開啟後會歸入家長陪伴的生活情境任務；關閉則屬於每日任務。
                      </p>
                    </div>
                    <Switch
                      checked={form.isOffline}
                      onCheckedChange={(checked) =>
                        updateForm("isOffline", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-700">啟用任務</p>
                      <p className="text-xs text-slate-500">
                        停用後不再參與分派與顯示
                      </p>
                    </div>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) =>
                        updateForm("isActive", checked)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:justify-end">
                  <Button
                    type="button"
                    onClick={handleCreateNew}
                    className="h-11 rounded-full bg-slate-100 px-5 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
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
                    {selectedMissionId ? "儲存修改" : "建立任務"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CozyPageWrapper>
  );
}

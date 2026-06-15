"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminStory,
  deleteAdminStory,
  listAdminStories,
  updateAdminStory,
  type StoryMutationRequest,
  type StoryResponse,
} from "@/lib/api/stories";
import { cn } from "@/lib/utils";

type StoryFormState = {
  id: string | null;
  title: string;
  titleEnglish: string;
  theme: string;
  generatedBy: string;
  contentCantonese: string;
  contentEnglish: string;
  storyText: string;
  storyTextSsml: string;
  featuredWords: string;
  audioFilename: string;
  readingTimeMinutes: string;
  difficultyLevel: string;
  sortOrder: string;
  isActive: boolean;
};

const THEME_OPTIONS = [
  { value: "none", label: "無主題（詞彙導向）" },
  { value: "bedtime", label: "睡前" },
  { value: "adventure", label: "冒險" },
  { value: "family", label: "家庭" },
  { value: "animals", label: "動物" },
  { value: "nature", label: "大自然" },
  { value: "friendship", label: "友誼" },
];

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"] as const;

function createEmptyStoryForm(): StoryFormState {
  return {
    id: null,
    title: "",
    titleEnglish: "",
    theme: "none",
    generatedBy: "admin",
    contentCantonese: "",
    contentEnglish: "",
    storyText: "",
    storyTextSsml: "",
    featuredWords: "",
    audioFilename: "curated-story.mp3",
    readingTimeMinutes: "5",
    difficultyLevel: "easy",
    sortOrder: "0",
    isActive: true,
  };
}

function storyToForm(story: StoryResponse): StoryFormState {
  return {
    id: story.id,
    title: story.title,
    titleEnglish: story.title_english ?? "",
    theme: story.theme ?? "none",
    generatedBy: story.generated_by ?? "admin",
    contentCantonese: story.content_cantonese,
    contentEnglish: story.content_english ?? "",
    storyText: story.story_text,
    storyTextSsml: story.story_text_ssml,
    featuredWords: story.featured_words.join("\n"),
    audioFilename: story.audio_filename,
    readingTimeMinutes: String(story.reading_time_minutes ?? 5),
    difficultyLevel: story.difficulty_level || "easy",
    sortOrder: String(story.sort_order ?? 0),
    isActive: story.is_active,
  };
}

function parseListInput(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildStoryPayload(form: StoryFormState): StoryMutationRequest {
  const contentCantonese = form.contentCantonese.trim();
  if (!contentCantonese) {
    throw new Error("請輸入故事內容。");
  }

  const title = form.title.trim();
  if (!title) {
    throw new Error("請輸入故事標題。");
  }

  const storyText = form.storyText.trim() || contentCantonese;
  const storyTextSsml =
    form.storyTextSsml.trim() || `<speak>${storyText}</speak>`;

  return {
    title,
    title_english: form.titleEnglish.trim() || null,
    theme: form.theme === "none" ? null : form.theme.trim() || null,
    story_type: "curated",
    generated_by: form.generatedBy.trim() || "admin",
    content_cantonese: contentCantonese,
    content_english: form.contentEnglish.trim() || null,
    story_text: storyText,
    story_text_ssml: storyTextSsml,
    featured_words: parseListInput(form.featuredWords),
    audio_filename: form.audioFilename.trim() || "curated-story.mp3",
    reading_time_minutes: Number(form.readingTimeMinutes || 5),
    difficulty_level: form.difficultyLevel,
    is_active: form.isActive,
    sort_order: Number(form.sortOrder || 0),
  };
}

function getThemeLabel(theme?: string | null): string {
  return (
    THEME_OPTIONS.find((option) => option.value === (theme ?? "none"))?.label ??
    theme ??
    "無主題"
  );
}

export function StoryManager() {
  const { toast } = useToast();

  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [form, setForm] = useState<StoryFormState>(createEmptyStoryForm());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  useEffect(() => {
    void loadStories();
  }, []);

  async function loadStories(nextSelectedStoryId?: string | null) {
    setLoading(true);
    setError(null);

    try {
      const storyList = await listAdminStories();
      setStories(storyList);

      const preferredStoryId =
        nextSelectedStoryId === undefined
          ? selectedStoryId
          : nextSelectedStoryId;
      const targetStoryId = storyList.some(
        (story) => story.id === preferredStoryId,
      )
        ? preferredStoryId
        : (storyList[0]?.id ?? null);

      setSelectedStoryId(targetStoryId);

      const selectedStory = storyList.find(
        (story) => story.id === targetStoryId,
      );
      setForm(
        selectedStory ? storyToForm(selectedStory) : createEmptyStoryForm(),
      );
    } catch (loadError) {
      console.error("Failed to load admin stories:", loadError);
      setError("未能載入故事內容，請確認你正使用管理員帳號。");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectStory(story: StoryResponse) {
    setSelectedStoryId(story.id);
    setForm(storyToForm(story));
    setIsEditorOpen(true);
  }

  function handleCreateNew() {
    setSelectedStoryId(null);
    setForm(createEmptyStoryForm());
    setIsEditorOpen(true);
  }

  function updateForm<K extends keyof StoryFormState>(
    key: K,
    value: StoryFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      const payload = buildStoryPayload(form);
      let savedStory: StoryResponse;

      if (selectedStoryId) {
        savedStory = await updateAdminStory(selectedStoryId, payload);
      } else {
        savedStory = await createAdminStory(payload);
      }

      await loadStories(savedStory.id);
      setIsEditorOpen(false);
      toast({
        title: selectedStoryId ? "故事已更新" : "故事已建立",
        description: `${savedStory.title} 已儲存到故事內容庫。`,
      });
    } catch (saveError) {
      console.error("Failed to save story:", saveError);
      toast({
        title: "儲存失敗",
        description:
          saveError instanceof Error && saveError.message
            ? saveError.message
            : "請檢查故事內容後再試。",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedStoryId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAdminStory(selectedStoryId);
      await loadStories(null);
      setIsEditorOpen(false);
      toast({
        title: "故事已隱藏",
        description: "該故事已從公開內容中停用。",
      });
    } catch (deleteError) {
      console.error("Failed to hide story:", deleteError);
      toast({
        title: "操作失敗",
        description:
          deleteError instanceof Error && deleteError.message
            ? deleteError.message
            : "請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  const filteredStories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return stories.filter((story) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? story.is_active : !story.is_active);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        story.title.toLowerCase().includes(normalizedQuery) ||
        (story.theme ?? "").toLowerCase().includes(normalizedQuery) ||
        story.content_cantonese.toLowerCase().includes(normalizedQuery) ||
        story.featured_words.some((word) =>
          word.toLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesQuery;
    });
  }, [searchQuery, statusFilter, stories]);

  const activeCount = stories.filter((story) => story.is_active).length;
  const themedCount = stories.filter((story) => Boolean(story.theme)).length;

  return (
    <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
      <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-slate-800">
              故事內容庫
            </CardTitle>
            <CardDescription className="mt-1">
              管理存放於 generated_stories 的 theme-based 與 vocabulary-focused
              故事。
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleCreateNew}
            className="h-11 rounded-full bg-violet-600 px-5 font-bold text-white hover:bg-violet-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            新增故事
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr,180px]">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜尋標題、主題或內容"
            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50">
              <SelectValue placeholder="全部狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="active">顯示中</SelectItem>
              <SelectItem value="inactive">已隱藏</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <Card className="rounded-[28px] border-none bg-sky-50 shadow-sm">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600/70">
                  故事總數
                </p>
                <p className="mt-3 text-3xl font-black text-sky-700">
                  {stories.length}
                </p>
              </div>
              <BookOpen className="h-10 w-10 text-sky-500" />
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-none bg-emerald-50 shadow-sm">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600/70">
                  顯示中
                </p>
                <p className="mt-3 text-3xl font-black text-emerald-700">
                  {activeCount}
                </p>
              </div>
              <Sparkles className="h-10 w-10 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-none bg-amber-50 shadow-sm">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-600/70">
                  主題標記
                </p>
                <p className="mt-3 text-3xl font-black text-amber-700">
                  {themedCount}
                </p>
              </div>
              <Sparkles className="h-10 w-10 text-amber-500" />
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mb-6 rounded-3xl border-amber-200 bg-amber-50 text-amber-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            正在載入故事內容...
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            目前沒有符合條件的故事內容。
          </div>
        ) : (
          <div className="max-h-155 overflow-y-auto rounded-3xl border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>標題</TableHead>
                  <TableHead>主題</TableHead>
                  <TableHead>重點詞語</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>排序</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStories.map((story) => {
                  const isSelected = story.id === selectedStoryId;

                  return (
                    <TableRow
                      key={story.id}
                      onClick={() => handleSelectStory(story)}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "bg-violet-50 hover:bg-violet-50",
                      )}
                    >
                      <TableCell className="max-w-75 whitespace-normal py-4">
                        <div>
                          <p className="font-black text-slate-800">
                            {story.title}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {story.content_cantonese.slice(0, 48) ||
                              "未提供內容"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                          {getThemeLabel(story.theme)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        {story.featured_words.slice(0, 3).join("、") ||
                          "未設定"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold",
                            story.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {story.is_active ? "顯示中" : "已隱藏"}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-600">
                        {story.sort_order ?? 0}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="rounded-[36px] border-none bg-white p-0 shadow-2xl sm:max-w-4xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left sm:px-8">
            <DialogTitle className="text-2xl font-black text-slate-800">
              {selectedStoryId ? "編輯故事" : "建立新故事"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              這個表單會直接編輯故事資料，適合管理主題故事與詞彙導向內容。
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable] sm:px-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="story-title">標題</Label>
                <Input
                  id="story-title"
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="h-11 rounded-2xl border-slate-200"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>主題</Label>
                  <Select
                    value={form.theme}
                    onValueChange={(value) => updateForm("theme", value)}
                  >
                    <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                      <SelectValue placeholder="選擇主題" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-generated-by">建立者</Label>
                  <Input
                    id="story-generated-by"
                    value={form.generatedBy}
                    onChange={(event) =>
                      updateForm("generatedBy", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="story-content">中文故事內容</Label>
                  <Textarea
                    id="story-content"
                    value={form.contentCantonese}
                    onChange={(event) =>
                      updateForm("contentCantonese", event.target.value)
                    }
                    className="min-h-32 rounded-2xl border-slate-200"
                    placeholder="輸入完整故事內容"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-featured-words">重點詞語</Label>
                  <Textarea
                    id="story-featured-words"
                    value={form.featuredWords}
                    onChange={(event) =>
                      updateForm("featuredWords", event.target.value)
                    }
                    className="min-h-32 rounded-2xl border-slate-200"
                    placeholder="每行一個詞語，或用逗號分隔"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="story-ssml">SSML</Label>
                <Textarea
                  id="story-ssml"
                  value={form.storyTextSsml}
                  onChange={(event) =>
                    updateForm("storyTextSsml", event.target.value)
                  }
                  className="min-h-28 rounded-2xl border-slate-200"
                  placeholder="可留空，將自動包成 <speak>..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="story-audio-filename">音訊檔名</Label>
                  <Input
                    id="story-audio-filename"
                    value={form.audioFilename}
                    onChange={(event) =>
                      updateForm("audioFilename", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-reading-time">閱讀時間（分鐘）</Label>
                  <Input
                    id="story-reading-time"
                    type="number"
                    min={1}
                    value={form.readingTimeMinutes}
                    onChange={(event) =>
                      updateForm("readingTimeMinutes", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>難度</Label>
                  <Select
                    value={form.difficultyLevel}
                    onValueChange={(value) =>
                      updateForm("difficultyLevel", value)
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="story-sort-order">排序</Label>
                  <Input
                    id="story-sort-order"
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateForm("sortOrder", event.target.value)
                    }
                    className="h-11 rounded-2xl border-slate-200"
                  />
                </div>
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-700">啟用故事</p>
                    <p className="text-xs text-slate-500">
                      停用後不會出現在前台故事列表
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

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={!selectedStoryId || deleting}
                  className="h-11 rounded-full border-rose-200 px-5 font-bold text-rose-600 hover:bg-rose-50"
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  隱藏故事
                </Button>

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  <Button
                    type="button"
                    onClick={handleCreateNew}
                    className="h-11 rounded-full bg-slate-100 px-5 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    清空表單
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="h-11 rounded-full bg-violet-600 px-5 font-bold text-white hover:bg-violet-500"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {selectedStoryId ? "儲存修改" : "建立故事"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

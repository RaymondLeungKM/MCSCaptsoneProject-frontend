"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { BookOpen, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  getAdminWords,
  createAdminWord,
  deleteAdminWord,
  getAdminCategories,
  updateAdminWord,
  uploadVocabularyImage,
  type AdminWordResponse,
  type CategoryResponse,
  type WordMutationRequest,
  type WordResponse,
} from "@/lib/api/vocabulary";
import { cn } from "@/lib/utils";

type VocabularyFormState = {
  id: string | null;
  word: string;
  wordCantonese: string;
  category: string;
  pronunciation: string;
  jyutping: string;
  definition: string;
  definitionCantonese: string;
  example: string;
  exampleCantonese: string;
  difficulty: "easy" | "medium" | "hard";
  physicalAction: string;
  imageUrl: string;
  audioUrl: string;
  audioUrlEnglish: string;
  contexts: string;
  relatedWords: string;
};

const DIFFICULTY_OPTIONS: Array<{
  value: "easy" | "medium" | "hard";
  label: string;
}> = [
  { value: "easy", label: "容易" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "較難" },
];

const ADMIN_IMAGE_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function isPreviewableImageUrl(value?: string): boolean {
  return (
    !!value &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/") ||
      value.startsWith("data:image/"))
  );
}

function resolveImagePreviewUrl(url: string): string {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  ) {
    return url;
  }

  const base = ADMIN_IMAGE_API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function createEmptyVocabularyForm(
  categories: CategoryResponse[],
): VocabularyFormState {
  return {
    id: null,
    word: "",
    wordCantonese: "",
    category: categories[0]?.id ?? "",
    pronunciation: "",
    jyutping: "",
    definition: "",
    definitionCantonese: "",
    example: "",
    exampleCantonese: "",
    difficulty: "easy",
    physicalAction: "",
    imageUrl: "",
    audioUrl: "",
    audioUrlEnglish: "",
    contexts: "",
    relatedWords: "",
  };
}

function vocabularyToForm(word: WordResponse): VocabularyFormState {
  return {
    id: word.id,
    word: word.word,
    wordCantonese: word.word_cantonese ?? "",
    category: word.category,
    pronunciation: word.pronunciation ?? "",
    jyutping: word.jyutping ?? "",
    definition: word.definition,
    definitionCantonese: word.definition_cantonese ?? "",
    example: word.example,
    exampleCantonese: word.example_cantonese ?? "",
    difficulty: word.difficulty,
    physicalAction: word.physical_action ?? "",
    imageUrl: word.image_url ?? "",
    audioUrl: word.audio_url ?? "",
    audioUrlEnglish: word.audio_url_english ?? "",
    contexts: word.contexts.join(", "),
    relatedWords: word.related_words.join(", "),
  };
}

function parseListInput(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildVocabularyPayload(
  form: VocabularyFormState,
): WordMutationRequest {
  return {
    word: form.word.trim(),
    word_cantonese: form.wordCantonese.trim() || undefined,
    category: form.category,
    pronunciation: form.pronunciation.trim() || undefined,
    jyutping: form.jyutping.trim() || undefined,
    definition: form.definition.trim(),
    definition_cantonese: form.definitionCantonese.trim() || undefined,
    example: form.example.trim(),
    example_cantonese: form.exampleCantonese.trim() || undefined,
    difficulty: form.difficulty,
    physical_action: form.physicalAction.trim() || undefined,
    image_url: form.imageUrl.trim() || undefined,
    audio_url: form.audioUrl.trim() || undefined,
    audio_url_english: form.audioUrlEnglish.trim() || undefined,
    contexts: parseListInput(form.contexts),
    related_words: parseListInput(form.relatedWords),
  };
}

function getCategoryOptionLabel(category: CategoryResponse): string {
  const baseLabel = category.name_cantonese || category.name;
  return category.is_active ? baseLabel : `${baseLabel}（已隱藏）`;
}

type VocabularyManagerProps = {
  refreshKey?: number;
};

export function VocabularyManager({ refreshKey = 0 }: VocabularyManagerProps) {
  const { toast } = useToast();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [words, setWords] = useState<AdminWordResponse[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [form, setForm] = useState<VocabularyFormState>(
    createEmptyVocabularyForm([]),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    void loadVocabularyData();
  }, [refreshKey]);

  useEffect(() => {
    setImagePreviewFailed(false);
  }, [form.imageUrl]);

  async function loadVocabularyData(nextSelectedWordId?: string | null) {
    setLoading(true);
    setError(null);

    try {
      const [categoryList, wordList] = await Promise.all([
        getAdminCategories(),
        getAdminWords({ limit: 500 }),
      ]);

      setCategories(categoryList);
      setWords(wordList);

      const preferredWordId =
        nextSelectedWordId === undefined ? selectedWordId : nextSelectedWordId;
      const targetWordId = wordList.some((word) => word.id === preferredWordId)
        ? preferredWordId
        : (wordList[0]?.id ?? null);
      setSelectedWordId(targetWordId);

      const selectedWord = wordList.find((word) => word.id === targetWordId);
      setForm(
        selectedWord
          ? vocabularyToForm(selectedWord)
          : createEmptyVocabularyForm(categoryList),
      );
    } catch (loadError) {
      console.error("Failed to load admin vocabulary:", loadError);
      setError("未能載入詞彙庫，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectWord(word: AdminWordResponse) {
    setSelectedWordId(word.id);
    setForm(vocabularyToForm(word));
    setIsEditorOpen(true);
  }

  function handleCreateNew() {
    setSelectedWordId(null);
    setForm(createEmptyVocabularyForm(categories));
    setIsEditorOpen(true);
  }

  function updateForm<K extends keyof VocabularyFormState>(
    key: K,
    value: VocabularyFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setUploadingImage(true);

    try {
      const uploadResult = await uploadVocabularyImage(selectedFile);
      updateForm("imageUrl", uploadResult.image_url);
      toast({
        title: "圖片已上傳",
        description: "圖片已儲存，並已自動填入圖片 URL。",
      });
    } catch (uploadError) {
      console.error("Failed to upload vocabulary image:", uploadError);
      const description =
        uploadError instanceof Error && uploadError.message
          ? uploadError.message
          : "未能上傳圖片，請稍後再試。";
      toast({
        title: "上傳失敗",
        description,
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      const payload = buildVocabularyPayload(form);
      let savedWord: WordResponse;

      if (selectedWordId) {
        savedWord = await updateAdminWord(selectedWordId, payload);
      } else {
        savedWord = await createAdminWord(payload);
      }

      await loadVocabularyData(savedWord.id);
      setIsEditorOpen(false);
      toast({
        title: selectedWordId ? "詞彙已更新" : "詞彙已建立",
        description: `${savedWord.word} 已儲存到共用詞彙庫。`,
      });
    } catch (saveError) {
      console.error("Failed to save admin word:", saveError);
      const description =
        saveError instanceof Error && saveError.message
          ? saveError.message
          : "請檢查詞彙內容後再試。";
      toast({
        title: "儲存失敗",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedWordId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAdminWord(selectedWordId);
      await loadVocabularyData(null);
      setIsEditorOpen(false);
      toast({
        title: "詞彙已刪除",
        description: "該詞彙已從共用詞彙庫中停用。",
      });
    } catch (deleteError) {
      console.error("Failed to delete admin word:", deleteError);
      const description =
        deleteError instanceof Error && deleteError.message
          ? deleteError.message
          : "未能刪除詞彙，請稍後再試。";
      toast({
        title: "刪除失敗",
        description,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  const filteredWords = words.filter((word) => {
    const normalizedCreatorQuery = creatorSearchQuery.trim().toLowerCase();
    const matchesQuery =
      searchQuery.trim().length === 0 ||
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (word.word_cantonese ?? "").includes(searchQuery);
    const matchesCreator =
      normalizedCreatorQuery.length === 0 ||
      (word.creator_user_email ?? "")
        .toLowerCase()
        .includes(normalizedCreatorQuery) ||
      (word.creator_user_id ?? "")
        .toLowerCase()
        .includes(normalizedCreatorQuery);
    const matchesCategory =
      categoryFilter === "all" || word.category === categoryFilter;
    const matchesDifficulty =
      difficultyFilter === "all" || word.difficulty === difficultyFilter;

    return (
      matchesQuery && matchesCreator && matchesCategory && matchesDifficulty
    );
  });

  const selectedWord = words.find((word) => word.id === selectedWordId) ?? null;
  const isUserUploadedWord = Boolean(selectedWord?.created_by_child_id);

  const trimmedImageUrl = form.imageUrl.trim();
  const canPreviewImage = isPreviewableImageUrl(trimmedImageUrl);
  const resolvedImagePreviewUrl = canPreviewImage
    ? resolveImagePreviewUrl(trimmedImageUrl)
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
            詞彙庫管理
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            可在這裡查看共享詞彙與使用者「我的」收藏詞彙；使用者上傳內容會標示建立者並以唯讀方式顯示。
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void loadVocabularyData()}
          disabled={loading}
          className="h-11 rounded-full bg-slate-800 px-5 font-bold text-white hover:bg-slate-700"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BookOpen className="mr-2 h-4 w-4" />
          )}
          重新整理詞彙
        </Button>
      </div>

      <Alert className="rounded-3xl border-sky-200 bg-sky-50 text-sky-900">
        <AlertDescription>
          可查看共享詞彙與「我的」收藏詞彙；屬於使用者收藏的詞語會顯示建立者資訊，並以唯讀方式開啟。
        </AlertDescription>
      </Alert>

      {error && (
        <Alert className="rounded-3xl border-amber-200 bg-amber-50 text-amber-900">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
          <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">
                  詞彙清單
                </CardTitle>
                <CardDescription className="mt-1">
                  目前共有 {words.length}{" "}
                  個詞彙，可按內容、分類、難度或建立者快速篩選。
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleCreateNew}
                className="h-11 rounded-full bg-sky-500 px-5 font-bold text-white hover:bg-sky-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增詞彙
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr,1fr,180px,160px]">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜尋英文或中文詞語"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
              <Input
                value={creatorSearchQuery}
                onChange={(event) => setCreatorSearchQuery(event.target.value)}
                placeholder="搜尋建立者電郵或 User ID"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50">
                  <SelectValue placeholder="全部分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分類</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {getCategoryOptionLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={difficultyFilter}
                onValueChange={(value) =>
                  setDifficultyFilter(
                    value as "all" | "easy" | "medium" | "hard",
                  )
                }
              >
                <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50">
                  <SelectValue placeholder="全部難度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部難度</SelectItem>
                  {DIFFICULTY_OPTIONS.map((option) => (
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
                正在載入詞彙庫...
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
                目前沒有符合條件的詞彙。
              </div>
            ) : (
              <div className="max-h-155 overflow-y-auto rounded-3xl border border-slate-100">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>詞語</TableHead>
                      <TableHead>分類</TableHead>
                      <TableHead>建立者</TableHead>
                      <TableHead>難度</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWords.map((word) => {
                      const isSelected = word.id === selectedWordId;

                      return (
                        <TableRow
                          key={word.id}
                          onClick={() => handleSelectWord(word)}
                          className={cn(
                            "cursor-pointer",
                            isSelected && "bg-sky-50 hover:bg-sky-50",
                          )}
                        >
                          <TableCell className="max-w-75 whitespace-normal py-4">
                            <div>
                              <p className="font-black text-slate-800">
                                {word.word_cantonese || word.word}
                              </p>
                              <p className="mt-1 text-xs font-medium text-slate-500">
                                {word.word}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                              {word.category_name_cantonese ||
                                word.category_name ||
                                "未分類"}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-60 whitespace-normal py-4">
                            {word.created_by_child_id ? (
                              <div>
                                <p className="font-bold text-slate-700">
                                  {word.creator_user_email ||
                                    word.creator_user_id ||
                                    "未知建立者"}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  {word.creator_child_name
                                    ? `${word.creator_child_name} 的「我的」收藏`
                                    : "來自「我的」收藏"}
                                </p>
                              </div>
                            ) : (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                系統詞彙
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                              {DIFFICULTY_OPTIONS.find(
                                (option) => option.value === word.difficulty,
                              )?.label ?? word.difficulty}
                            </span>
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

        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="rounded-[36px] border-none bg-white p-0 shadow-2xl sm:max-w-5xl">
            <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left sm:px-8">
              <DialogTitle className="text-2xl font-black text-slate-800">
                {selectedWordId ? "編輯詞彙" : "建立新詞彙"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                可編輯完整雙語內容、例句、發音與媒體欄位。
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable] sm:px-8">
              <div className="space-y-5">
                {isUserUploadedWord && (
                  <>
                    <Alert className="rounded-3xl border-violet-200 bg-violet-50 text-violet-900">
                      <AlertDescription>
                        這個詞彙來自「我的」收藏。管理後台目前只提供檢視，不能直接修改或刪除。
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="admin-creator-email">建立者電郵</Label>
                        <Input
                          id="admin-creator-email"
                          readOnly
                          value={selectedWord?.creator_user_email ?? ""}
                          className="h-11 rounded-2xl border-slate-200 bg-slate-50 text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-creator-id">建立者 User ID</Label>
                        <Input
                          id="admin-creator-id"
                          readOnly
                          value={selectedWord?.creator_user_id ?? ""}
                          className="h-11 rounded-2xl border-slate-200 bg-slate-50 text-slate-500"
                        />
                      </div>
                    </div>

                    {selectedWord?.creator_child_name && (
                      <p className="text-sm font-medium text-slate-500">
                        來源：{selectedWord.creator_child_name} 的「我的」收藏
                      </p>
                    )}
                  </>
                )}

                <fieldset
                  className={cn(
                    "space-y-5",
                    isUserUploadedWord && "opacity-70",
                  )}
                  disabled={isUserUploadedWord}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-word-english">英文詞語</Label>
                      <Input
                        id="admin-word-english"
                        value={form.word}
                        onChange={(event) =>
                          updateForm("word", event.target.value)
                        }
                        className="h-11 rounded-2xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-word-cantonese">中文詞語</Label>
                      <Input
                        id="admin-word-cantonese"
                        value={form.wordCantonese}
                        onChange={(event) =>
                          updateForm("wordCantonese", event.target.value)
                        }
                        className="h-11 rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>分類</Label>
                      <Select
                        value={form.category}
                        onValueChange={(value) => updateForm("category", value)}
                      >
                        <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                          <SelectValue placeholder="選擇分類" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {getCategoryOptionLabel(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>難度</Label>
                      <Select
                        value={form.difficulty}
                        onValueChange={(value) =>
                          updateForm(
                            "difficulty",
                            value as "easy" | "medium" | "hard",
                          )
                        }
                      >
                        <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map((option) => (
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
                      <Label htmlFor="admin-pronunciation">英文發音</Label>
                      <Input
                        id="admin-pronunciation"
                        value={form.pronunciation}
                        onChange={(event) =>
                          updateForm("pronunciation", event.target.value)
                        }
                        className="h-11 rounded-2xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-jyutping">Jyutping</Label>
                      <Input
                        id="admin-jyutping"
                        value={form.jyutping}
                        onChange={(event) =>
                          updateForm("jyutping", event.target.value)
                        }
                        className="h-11 rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-definition">英文定義</Label>
                      <Textarea
                        id="admin-definition"
                        value={form.definition}
                        onChange={(event) =>
                          updateForm("definition", event.target.value)
                        }
                        className="min-h-24 rounded-2xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-definition-cantonese">
                        中文定義
                      </Label>
                      <Textarea
                        id="admin-definition-cantonese"
                        value={form.definitionCantonese}
                        onChange={(event) =>
                          updateForm("definitionCantonese", event.target.value)
                        }
                        className="min-h-24 rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-example">英文例句</Label>
                      <Textarea
                        id="admin-example"
                        value={form.example}
                        onChange={(event) =>
                          updateForm("example", event.target.value)
                        }
                        className="min-h-24 rounded-2xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-example-cantonese">中文例句</Label>
                      <Textarea
                        id="admin-example-cantonese"
                        value={form.exampleCantonese}
                        onChange={(event) =>
                          updateForm("exampleCantonese", event.target.value)
                        }
                        className="min-h-24 rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-physical-action">動作提示</Label>
                    <Input
                      id="admin-physical-action"
                      value={form.physicalAction}
                      onChange={(event) =>
                        updateForm("physicalAction", event.target.value)
                      }
                      placeholder="例如：拍動雙手模仿蝴蝶"
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-image-url">圖片 URL</Label>
                      <Input
                        id="admin-image-url"
                        value={form.imageUrl}
                        onChange={(event) =>
                          updateForm("imageUrl", event.target.value)
                        }
                        className="h-11 rounded-2xl border-slate-200"
                      />
                      <Input
                        id="admin-image-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={(event) => void handleImageUpload(event)}
                        disabled={uploadingImage}
                        className="h-auto rounded-2xl border-dashed border-slate-300 bg-slate-50 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <div className="flex min-h-5 items-center gap-2 text-xs font-medium text-slate-500">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>正在上傳圖片...</span>
                          </>
                        ) : (
                          <span>
                            支援 JPG、PNG、GIF、WEBP，最大
                            10MB。上傳完成後會自動填入圖片 URL。
                          </span>
                        )}
                      </div>
                      {trimmedImageUrl ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                              圖片預覽
                            </p>
                            <span className="text-xs font-bold text-slate-500">
                              {imagePreviewFailed ? "載入失敗" : "即時預覽"}
                            </span>
                          </div>

                          {canPreviewImage && !imagePreviewFailed ? (
                            <div className="flex min-h-40 items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
                              <img
                                src={resolvedImagePreviewUrl}
                                alt={
                                  form.wordCantonese ||
                                  form.word ||
                                  "Vocabulary preview"
                                }
                                className="max-h-72 max-w-full rounded-xl object-contain"
                                onError={() => setImagePreviewFailed(true)}
                                onLoad={() => setImagePreviewFailed(false)}
                              />
                            </div>
                          ) : (
                            <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center text-sm font-medium text-slate-500">
                              {canPreviewImage
                                ? "無法載入這張圖片，請檢查網址是否可公開存取。"
                                : "目前只支援預覽 http(s)、/uploads/... 或 data:image/... 形式的圖片網址。"}
                            </div>
                          )}

                          {canPreviewImage && (
                            <p className="mt-2 break-all text-xs font-medium text-slate-400">
                              {resolvedImagePreviewUrl}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-audio-url">中文音檔 URL</Label>
                      <Input
                        id="admin-audio-url"
                        value={form.audioUrl}
                        onChange={(event) =>
                          updateForm("audioUrl", event.target.value)
                        }
                        className="h-11 rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-audio-url-english">
                      英文音檔 URL
                    </Label>
                    <Input
                      id="admin-audio-url-english"
                      value={form.audioUrlEnglish}
                      onChange={(event) =>
                        updateForm("audioUrlEnglish", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-contexts">使用情境</Label>
                      <Textarea
                        id="admin-contexts"
                        value={form.contexts}
                        onChange={(event) =>
                          updateForm("contexts", event.target.value)
                        }
                        placeholder="例如：home, school, playground"
                        className="min-h-20 rounded-2xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-related-words">相關詞語</Label>
                      <Textarea
                        id="admin-related-words"
                        value={form.relatedWords}
                        onChange={(event) =>
                          updateForm("relatedWords", event.target.value)
                        }
                        placeholder="例如：apple, banana, fruit"
                        className="min-h-20 rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          disabled={
                            !selectedWordId || deleting || isUserUploadedWord
                          }
                          className="h-11 rounded-full bg-rose-100 px-5 font-bold text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                        >
                          {deleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          刪除詞彙
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-4xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>刪除此詞彙？</AlertDialogTitle>
                          <AlertDialogDescription>
                            這會將詞彙從共用詞彙庫停用，不會刪除 `My Collection`
                            內容，也會保留既有學習進度紀錄。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">
                            取消
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDelete()}
                            className="rounded-full bg-rose-500 text-white hover:bg-rose-400"
                          >
                            確認刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <div className="flex flex-col gap-3 md:flex-row md:justify-end">
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
                        disabled={
                          saving || !form.category || isUserUploadedWord
                        }
                        className="h-11 rounded-full bg-emerald-500 px-5 font-bold text-white hover:bg-emerald-400"
                      >
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {selectedWordId ? "儲存詞彙" : "建立詞彙"}
                      </Button>
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

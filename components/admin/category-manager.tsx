"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Tags,
  Trash2,
} from "lucide-react";

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
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
  type CategoryMutationRequest,
  type CategoryResponse,
} from "@/lib/api/vocabulary";
import {
  CATEGORY_COLOR_PALETTE,
  resolveCategoryColor,
} from "@/lib/category-colors";
import { cn } from "@/lib/utils";

type CategoryFormState = {
  id: string | null;
  name: string;
  nameCantonese: string;
  icon: string;
  color: string;
  status: CategoryStatus;
  sortOrder: string;
  description: string;
  descriptionCantonese: string;
};

type CategoryStatus = "active" | "inactive";

const CATEGORY_STATUS_OPTIONS: Array<{
  value: CategoryStatus;
  label: string;
}> = [
  { value: "active", label: "顯示中" },
  { value: "inactive", label: "已隱藏" },
];

const CATEGORY_COLOR_OPTIONS = CATEGORY_COLOR_PALETTE.map((color) => ({
  value: color,
  label: color.replace(/^bg-/, "").replace(/-/g, " "),
}));

function createEmptyCategoryForm(sortOrder: string = ""): CategoryFormState {
  return {
    id: null,
    name: "",
    nameCantonese: "",
    icon: "📚",
    color: "",
    status: "active",
    sortOrder,
    description: "",
    descriptionCantonese: "",
  };
}

function categoryToForm(category: CategoryResponse): CategoryFormState {
  return {
    id: category.id,
    name: category.name,
    nameCantonese: category.name_cantonese ?? "",
    icon: category.icon,
    color: category.color ?? "",
    status: category.is_active ? "active" : "inactive",
    sortOrder: String(category.sort_order ?? 0),
    description: category.description ?? "",
    descriptionCantonese: category.description_cantonese ?? "",
  };
}

function getNextCategorySortOrder(categories: CategoryResponse[]): string {
  const maxSortOrder = categories.reduce(
    (currentMax, category) => Math.max(currentMax, category.sort_order ?? 0),
    -1,
  );

  return String(maxSortOrder + 1);
}

function buildCategoryPayload(
  form: CategoryFormState,
): CategoryMutationRequest {
  return {
    name: form.name.trim(),
    name_cantonese: form.nameCantonese.trim() || undefined,
    icon: form.icon.trim() || "📚",
    color: form.color.trim() || undefined,
    is_active: form.status === "active",
    sort_order:
      form.sortOrder.trim().length > 0 ? Number(form.sortOrder) : undefined,
    description: form.description.trim() || undefined,
    description_cantonese: form.descriptionCantonese.trim() || undefined,
  };
}

function getCategoryStatusLabel(status: CategoryStatus): string {
  return (
    CATEGORY_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "顯示中"
  );
}

type CategoryManagerProps = {
  onCategoriesChanged?: () => void;
};

export function CategoryManager({ onCategoriesChanged }: CategoryManagerProps) {
  const { toast } = useToast();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<CategoryFormState>(
    createEmptyCategoryForm(),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    void loadCategories();
  }, []);

  async function loadCategories(nextSelectedCategoryId?: string | null) {
    setLoading(true);
    setError(null);

    try {
      const categoryList = await getAdminCategories();
      setCategories(categoryList);

      const preferredCategoryId =
        nextSelectedCategoryId === undefined
          ? selectedCategoryId
          : nextSelectedCategoryId;
      const targetCategoryId = categoryList.some(
        (category) => category.id === preferredCategoryId,
      )
        ? preferredCategoryId
        : (categoryList[0]?.id ?? null);

      setSelectedCategoryId(targetCategoryId);

      const selectedCategory = categoryList.find(
        (category) => category.id === targetCategoryId,
      );
      setForm(
        selectedCategory
          ? categoryToForm(selectedCategory)
          : createEmptyCategoryForm(getNextCategorySortOrder(categoryList)),
      );
    } catch (loadError) {
      console.error("Failed to load admin categories:", loadError);
      setError("未能載入分類列表，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCategory(category: CategoryResponse) {
    setSelectedCategoryId(category.id);
    setForm(categoryToForm(category));
    setIsEditorOpen(true);
  }

  function handleCreateNew() {
    setSelectedCategoryId(null);
    setForm(createEmptyCategoryForm(getNextCategorySortOrder(categories)));
    setIsEditorOpen(true);
  }

  function updateForm<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      const payload = buildCategoryPayload(form);
      let savedCategory: CategoryResponse;

      if (selectedCategoryId) {
        savedCategory = await updateAdminCategory(selectedCategoryId, payload);
      } else {
        savedCategory = await createAdminCategory(payload);
      }

      await loadCategories(savedCategory.id);
      onCategoriesChanged?.();
      setIsEditorOpen(false);
      toast({
        title: selectedCategoryId ? "分類已更新" : "分類已建立",
        description: `${savedCategory.name_cantonese || savedCategory.name} 已儲存。`,
      });
    } catch (saveError) {
      console.error("Failed to save admin category:", saveError);
      const description =
        saveError instanceof Error && saveError.message
          ? saveError.message
          : "請檢查分類資料後再試。";
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
    if (!selectedCategoryId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAdminCategory(selectedCategoryId);
      await loadCategories(null);
      onCategoriesChanged?.();
      setIsEditorOpen(false);
      toast({
        title: "分類已刪除",
        description: "該分類已從共用詞彙分類清單中移除。",
      });
    } catch (deleteError) {
      console.error("Failed to delete admin category:", deleteError);
      const description =
        deleteError instanceof Error && deleteError.message
          ? deleteError.message
          : "未能刪除分類，請稍後再試。";
      toast({
        title: "刪除失敗",
        description,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  const filteredCategories = categories.filter((category) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return (
      normalizedQuery.length === 0 ||
      category.name.toLowerCase().includes(normalizedQuery) ||
      (category.name_cantonese ?? "").includes(searchQuery)
    );
  });

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );
  const selectedCategoryWordCount = selectedCategory?.word_count ?? 0;
  const deleteBlocked = selectedCategoryWordCount > 0;
  const hiddenCategoryCount = categories.filter(
    (category) => !category.is_active,
  ).length;
  const previewColor = resolveCategoryColor(
    form.color,
    form.name.trim() || "category",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
            分類管理
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            管理共用詞彙分類，可新增、編輯與停用主題分類，供下方詞彙庫表單直接選用。
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void loadCategories()}
          disabled={loading}
          className="h-11 rounded-full bg-slate-800 px-5 font-bold text-white hover:bg-slate-700"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          重新整理分類
        </Button>
      </div>

      <Alert className="rounded-3xl border-violet-200 bg-violet-50 text-violet-900">
        <AlertDescription>
          可用「狀態」欄位決定分類是否顯示在前端
          UI。刪除分類前仍會要求確認；若分類仍有共用詞彙，系統會拒絕刪除。
        </AlertDescription>
      </Alert>

      {error && (
        <Alert className="rounded-3xl border-amber-200 bg-amber-50 text-amber-900">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
          <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">
                  分類清單
                </CardTitle>
                <CardDescription className="mt-1">
                  目前共有 {categories.length} 個分類，其中{" "}
                  {hiddenCategoryCount} 個已隱藏。點擊任一分類即可在視窗中編輯。
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleCreateNew}
                className="h-11 rounded-full bg-violet-500 px-5 font-bold text-white hover:bg-violet-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增分類
              </Button>
            </div>

            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋分類名稱"
              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
            />
          </CardHeader>

          <CardContent className="pt-5">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                正在載入分類...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
                目前沒有符合條件的分類。
              </div>
            ) : (
              <div className="max-h-130 overflow-y-auto rounded-3xl border border-slate-100">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>分類</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>配色</TableHead>
                      <TableHead>排序</TableHead>
                      <TableHead>詞彙數</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category, index) => {
                      const isSelected = category.id === selectedCategoryId;
                      const categoryColor = resolveCategoryColor(
                        category.color,
                        category.name,
                        index,
                      );

                      return (
                        <TableRow
                          key={category.id}
                          onClick={() => handleSelectCategory(category)}
                          className={cn(
                            "cursor-pointer",
                            isSelected && "bg-violet-50 hover:bg-violet-50",
                          )}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl shadow-sm">
                                {category.icon}
                              </div>
                              <div>
                                <p className="font-black text-slate-800">
                                  {category.name_cantonese || category.name}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  {category.name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-bold",
                                category.is_active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {category.is_active ? "顯示中" : "已隱藏"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-4 w-4 rounded-full ring-1 ring-slate-200",
                                  categoryColor,
                                )}
                              />
                              <span className="text-xs font-bold text-slate-500">
                                {categoryColor.replace(/^bg-/, "")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-slate-600">
                            {category.sort_order ?? 0}
                          </TableCell>
                          <TableCell className="font-bold text-slate-600">
                            {category.word_count}
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
          <DialogContent className="rounded-[36px] border-none bg-white p-0 shadow-2xl sm:max-w-3xl">
            <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left sm:px-8">
              <DialogTitle className="text-2xl font-black text-slate-800">
                {selectedCategoryId ? "編輯分類" : "建立新分類"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                設定名稱、圖示與配色後，分類會立即出現在詞彙管理表單與篩選器中。
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable] sm:px-8">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-name-english">英文名稱</Label>
                    <Input
                      id="category-name-english"
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-name-cantonese">中文名稱</Label>
                    <Input
                      id="category-name-cantonese"
                      value={form.nameCantonese}
                      onChange={(event) =>
                        updateForm("nameCantonese", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[120px,1fr]">
                  <div className="space-y-2">
                    <Label htmlFor="category-icon">圖示</Label>
                    <Input
                      id="category-icon"
                      value={form.icon}
                      onChange={(event) =>
                        updateForm("icon", event.target.value)
                      }
                      placeholder="📚"
                      className="h-11 rounded-2xl border-slate-200 text-center text-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>配色</Label>
                    <Select
                      value={form.color || "auto"}
                      onValueChange={(value) =>
                        updateForm("color", value === "auto" ? "" : value)
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                        <SelectValue placeholder="自動配色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">自動配色</SelectItem>
                        {CATEGORY_COLOR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr,180px]">
                  <div className="space-y-2">
                    <Label>狀態</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        updateForm("status", value as CategoryStatus)
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-sort-order">顯示順序</Label>
                    <Input
                      id="category-sort-order"
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(event) =>
                        updateForm("sortOrder", event.target.value)
                      }
                      className="h-11 rounded-2xl border-slate-200"
                    />
                    <p className="text-xs font-medium text-slate-400">
                      數字越小越前；新分類預設排到最後。
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    顯示預覽
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ring-1 ring-white/70",
                        previewColor,
                      )}
                    >
                      {form.icon.trim() || "📚"}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">
                        {form.nameCantonese.trim() ||
                          form.name.trim() ||
                          "未命名分類"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                        <span>排序 {form.sortOrder || "auto"}</span>
                        <span>{previewColor.replace(/^bg-/, "")}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-bold",
                            form.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-200 text-slate-700",
                          )}
                        >
                          {getCategoryStatusLabel(form.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-description">英文描述</Label>
                    <Textarea
                      id="category-description"
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      className="min-h-24 rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-description-cantonese">
                      中文描述
                    </Label>
                    <Textarea
                      id="category-description-cantonese"
                      value={form.descriptionCantonese}
                      onChange={(event) =>
                        updateForm("descriptionCantonese", event.target.value)
                      }
                      className="min-h-24 rounded-2xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={!selectedCategoryId || deleting}
                        className="h-11 rounded-full bg-rose-100 px-5 font-bold text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                      >
                        {deleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        刪除分類
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-4xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>刪除此分類？</AlertDialogTitle>
                        <AlertDialogDescription>
                          {deleteBlocked
                            ? `${selectedCategory?.name_cantonese || selectedCategory?.name || "此分類"} 目前仍有 ${selectedCategoryWordCount} 個共用詞彙，請先在下方詞彙庫管理中重新指派或停用相關詞彙。`
                            : `${selectedCategory?.name_cantonese || selectedCategory?.name || "此分類"} 會從共用分類清單中停用。這是為了避免誤刪而加入的最後確認。`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">
                          取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDelete()}
                          disabled={deleteBlocked || deleting}
                          className="rounded-full bg-rose-500 text-white hover:bg-rose-400 disabled:pointer-events-none disabled:opacity-50"
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
                      disabled={saving || !form.name.trim()}
                      className="h-11 rounded-full bg-emerald-500 px-5 font-bold text-white hover:bg-emerald-400"
                    >
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {selectedCategoryId ? "儲存分類" : "建立分類"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

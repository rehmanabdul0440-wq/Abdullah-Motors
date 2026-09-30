import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  X,
  Upload,
  BookOpen,
  Eye,
  FileText,
  AlertTriangle,
  ImageOff,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/blogs")({
  component: AdminBlogs,
});

type Blog = {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  author_id: string | null;
};

// ── Zod Schema ───────────────────────────────────────────────────────────────
const blogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, digits and hyphens only"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  cover_image_url: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]),
});

type BlogFormValues = z.infer<typeof blogSchema>;

// Helper to auto-generate slug
function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function AdminBlogs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Fetch Blogs
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blogs", page, search],
    queryFn: async () => {
      let query = supabase
        .from("blogs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: rows, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        rows: (rows || []) as Blog[],
        total: count || 0,
      };
    },
  });

  const blogs = data?.rows || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 2. Inline toggle status mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "published" }) => {
      const published_at = status === "published" ? new Date().toISOString() : null;
      const { error } = await (supabase as any)
        .from("blogs")
        .update({ status, published_at })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "published" ? "Article published live!" : "Article reverted to draft."
      );
      qc.invalidateQueries({ queryKey: ["admin", "blogs"] });
      qc.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to update article status");
    },
  });

  // 3. Delete Article Mutation
  const deleteMutation = useMutation({
    mutationFn: async (blog: Blog) => {
      // Remove cover file if it exists inside our storage bucket (best-effort)
      if (blog.cover_image_url) {
        const path = blog.cover_image_url.split("/blog-images/").pop();
        if (path) {
          await supabase.storage.from("blog-images").remove([path]);
        }
      }
      const { error } = await supabase.from("blogs").delete().eq("id", blog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article deleted successfully");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "blogs"] });
      qc.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to delete article");
      setDeleteTarget(null);
    },
  });

  const handleOpenNewForm = () => {
    setEditingBlog(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (blog: Blog) => {
    setEditingBlog(blog);
    setIsFormOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not published";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-sm text-foreground">Manage Articles</h1>
          <p className="text-body text-muted-foreground mt-1">
            Write, edit, preview, or publish blog posts for the Abdullah Journal.
          </p>
        </div>
        <Button
          onClick={handleOpenNewForm}
          className="rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-95 shadow-glow cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {/* Main card list */}
      <Card className="glass-surface border border-border/40 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-title text-foreground">Blog Articles</CardTitle>
              <CardDescription>View status and history of all content pieces</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 rounded-xl bg-surface/50 border-border/40 focus:border-primary/50 text-sm h-10 w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              {search ? "No articles match your search." : "No articles written yet."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium w-14">Cover</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Title</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Published Date</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map((blog) => (
                      <TableRow
                        key={blog.id}
                        className="border-b border-border/40 hover:bg-white/[0.01]"
                      >
                        <TableCell>
                          <div className="h-10 w-14 rounded-lg overflow-hidden bg-surface flex items-center justify-center shrink-0 border border-border">
                            {blog.cover_image_url ? (
                              <img
                                src={blog.cover_image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageOff className="h-4 w-4 text-muted-foreground/30" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          <div>
                            <p className="text-sm font-semibold">{blog.title}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              /{blog.slug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />{" "}
                            {formatDate(blog.published_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: blog.id,
                                status: blog.status === "published" ? "draft" : "published",
                              })
                            }
                            disabled={togglePublishMutation.isPending}
                            className="inline-block"
                            title="Click to toggle publish status"
                          >
                            <Badge
                              className={`text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 border cursor-pointer select-none transition-all hover:scale-[1.03] ${
                                blog.status === "published"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40"
                              }`}
                            >
                              {blog.status}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link to="/blog/$slug" params={{ slug: blog.slug }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                title="Preview article"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                              onClick={() => handleOpenEditForm(blog)}
                              title="Edit Article"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                              onClick={() => setDeleteTarget(blog)}
                              title="Delete Article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/20 pt-4">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages} ({totalCount} total)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="glass-surface max-w-4xl border-border/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-title flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editingBlog ? "Edit Article" : "Create New Article"}
            </DialogTitle>
            <DialogDescription>
              Write compelling content about car tech, culture, or buying advice
            </DialogDescription>
          </DialogHeader>

          {isFormOpen && (
            <BlogForm
              editingBlog={editingBlog}
              onClose={() => setIsFormOpen(false)}
              authorId={user?.id || null}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Article Confirmation AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-surface border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Article?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.title}</span>?
              All images and database mappings will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Custom Blog Form ──────────────────────────────────────────────────────────

function BlogForm({
  editingBlog,
  onClose,
  authorId,
}: {
  editingBlog: Blog | null;
  onClose: () => void;
  authorId: string | null;
}) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(editingBlog?.cover_image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: editingBlog?.title || "",
      slug: editingBlog?.slug || "",
      content: editingBlog?.content || "",
      cover_image_url: editingBlog?.cover_image_url || "",
      status: editingBlog?.status || "draft",
    },
  });

  const watchedTitle = watch("title");
  const watchedContent = watch("content");
  const [slugEdited, setSlugEdited] = useState(!!editingBlog?.slug);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited && watchedTitle) {
      setValue("slug", slugify(watchedTitle), { shouldValidate: true });
    }
  }, [watchedTitle, slugEdited, setValue]);

  // Sync Cover URL to react-hook-form value
  useEffect(() => {
    setValue("cover_image_url", coverUrl);
  }, [coverUrl, setValue]);

  // ── Cover Image Upload to bucket: 'blog-images' ──────────────────────────
  const handleUploadImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size exceeds 8 MB limit");
      return;
    }

    setUploadingImage(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("blog-images")
      .upload(filename, file, { cacheControl: "3600", upsert: false });

    if (storageErr) {
      toast.error(`Upload failed: ${storageErr.message}`);
      setUploadingImage(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filename);

    setCoverUrl(urlData.publicUrl);
    setUploadingImage(false);
    toast.success("Cover image uploaded");
  };

  const handleRemoveCover = async () => {
    if (!coverUrl) return;
    const path = coverUrl.split("/blog-images/").pop();
    if (path) {
      // Best-effort removal from storage
      await supabase.storage.from("blog-images").remove([path]);
    }
    setCoverUrl(null);
    toast.success("Cover image removed");
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  const onSubmit = async (values: BlogFormValues) => {
    setSubmitting(true);
    const published_at =
      values.status === "published"
        ? editingBlog?.published_at || new Date().toISOString()
        : null;

    const payload = {
      title: values.title,
      slug: values.slug,
      content: values.content,
      cover_image_url: values.cover_image_url || null,
      status: values.status,
      published_at,
      author_id: editingBlog?.author_id || authorId,
    };

    let resultError;

    if (editingBlog) {
      // Update
      const { error } = await (supabase as any)
        .from("blogs")
        .update(payload)
        .eq("id", editingBlog.id);
      resultError = error;
    } else {
      // Insert
      const { error } = await (supabase as any)
        .from("blogs")
        .insert([payload]);
      resultError = error;
    }

    setSubmitting(false);

    if (resultError) {
      if (resultError.code === "23505") {
        toast.error("An article with this slug or title already exists. Change title/slug.");
      } else {
        toast.error(resultError.message || "Failed to save article");
      }
    } else {
      toast.success(editingBlog ? "Article updated successfully" : "Article created successfully");
      qc.invalidateQueries({ queryKey: ["admin", "blogs"] });
      qc.invalidateQueries({ queryKey: ["blogs"] });
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="b-title">Title <span className="text-red-500">*</span></Label>
          <Input
            id="b-title"
            placeholder="e.g. Electric Vehicle Buying Guide 2024"
            {...register("title")}
            className="rounded-xl bg-surface/50 border-border/40"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="b-slug">Slug (URL) <span className="text-red-500">*</span></Label>
          <Input
            id="b-slug"
            placeholder="electric-vehicle-buying-guide-2024"
            {...register("slug")}
            onChange={(e) => {
              register("slug").onChange(e);
              setSlugEdited(true);
            }}
            className="rounded-xl bg-surface/50 border-border/40 font-mono text-sm"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      {/* Cover Image uploader */}
      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 rounded-2xl border border-border/30 bg-surface/10">
          <div className="h-28 w-40 rounded-xl overflow-hidden bg-surface/50 flex items-center justify-center border border-border shrink-0">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="h-6 w-6 text-muted-foreground/30" />
            )}
          </div>

          <div className="space-y-2 flex-1 w-full text-center sm:text-left">
            <p className="text-xs text-muted-foreground">
              Add a compelling banner cover image. Max size 8 MB.
            </p>
            <div className="flex justify-center sm:justify-start gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="rounded-xl flex items-center gap-1"
              >
                {uploadingImage ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Upload Photo
              </Button>
              {coverUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCover}
                  className="rounded-xl text-destructive hover:bg-destructive/10"
                >
                  Remove Cover
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUploadImage(e.target.files)}
          />
        </div>
      </div>

      {/* Editor & Preview tabs */}
      <div className="space-y-2">
        <Label>Article Content <span className="text-red-500">*</span></Label>
        <Tabs defaultValue="editor" className="w-full border border-border/40 rounded-2xl bg-surface/10 p-2">
          <TabsList className="grid w-60 grid-cols-2 bg-surface/50 rounded-xl">
            <TabsTrigger value="editor" className="rounded-lg text-xs font-semibold">Write</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-lg text-xs font-semibold">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-2 space-y-2">
            <Textarea
              id="b-content"
              rows={15}
              placeholder="Start writing in markdown syntax here..."
              {...register("content")}
              className="rounded-xl bg-surface/50 border-border/40 font-mono text-sm resize-none focus-visible:ring-1"
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </TabsContent>

          <TabsContent value="preview" className="mt-2 p-4 rounded-xl border border-border/20 bg-background/50 h-[335px] overflow-y-auto max-w-none">
            {watchedContent ? (
              <div className="space-y-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap max-w-none">
                {watchedContent}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-20">
                Write some markdown content to preview it here...
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Article Settings */}
      <div className="flex items-center gap-6 rounded-2xl border border-border/20 bg-surface/20 p-4">
        {/* Status Dropdown */}
        <div className="space-y-1">
          <Label htmlFor="b-status" className="text-xs font-medium">Publish State</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Tabs
                value={field.value}
                onValueChange={field.onChange}
                className="w-48 bg-surface/50 p-1 rounded-xl"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-lg bg-transparent">
                  <TabsTrigger value="draft" className="rounded-md text-[10px] uppercase font-bold tracking-wider">
                    Draft
                  </TabsTrigger>
                  <TabsTrigger value="published" className="rounded-md text-[10px] uppercase font-bold tracking-wider">
                    Publish Live
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />
        </div>
      </div>

      {/* Dialog Footer Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border/20 pt-4">
        <Button type="button" variant="ghost" className="rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-95 shadow-glow"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving Article…
            </>
          ) : (
            "Save Article"
          )}
        </Button>
      </div>
    </form>
  );
}

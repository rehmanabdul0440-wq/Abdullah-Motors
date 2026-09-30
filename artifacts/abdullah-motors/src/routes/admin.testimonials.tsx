import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X,
  Star,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  MessageSquareOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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

export const Route = createFileRoute("/admin/testimonials")({
  component: AdminTestimonials,
});

type Testimonial = {
  id: string;
  customer_name: string;
  avatar_url: string | null;
  rating: number;
  message: string;
  is_approved: boolean;
  created_at: string;
};

function AdminTestimonials() {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Fetch Testimonials from Supabase
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "testimonials", page],
    queryFn: async () => {
      const query = supabase
        .from("testimonials")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: rows, error, count } = await query.range(from, to);
      
      if (error) throw error;

      return {
        rows: (rows || []) as Testimonial[],
        total: count || 0,
      };
    },
  });

  const testimonials = data?.rows || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 2. Approve/Disapprove Testimonial Mutation
  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await (supabase as any)
        .from("testimonials")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.is_approved
          ? "Testimonial approved successfully!"
          : "Testimonial disapproved successfully!"
      );
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      qc.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to update testimonial status");
    },
  });

  // 3. Delete Testimonial Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Testimonial deleted successfully!");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      qc.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to delete testimonial");
      setDeleteTarget(null);
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <h1 className="text-display-sm text-foreground">Customer Testimonials</h1>
        <p className="text-body text-muted-foreground mt-1">
          Review, approve, or remove testimonials submitted by customers.
        </p>
      </div>

      {/* Grid List */}
      <Card className="glass-surface border border-border/40 shadow-lg">
        <CardHeader>
          <CardTitle className="text-title text-foreground">Feedback Moderation</CardTitle>
          <CardDescription>
            Approved testimonials will display publicly on the homepage and review board
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
              <MessageSquareOff className="h-10 w-10 text-muted-foreground/40" />
              <span>No customer testimonials found.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Rating</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Review Message</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Submitted</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testimonials.map((t) => (
                      <TableRow
                        key={t.id}
                        className={`border-b border-border/40 transition-colors ${
                          !t.is_approved
                            ? "bg-purple-500/[0.02] hover:bg-purple-500/[0.04]"
                            : "hover:bg-white/[0.01]"
                        }`}
                      >
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex items-center gap-3">
                            {t.avatar_url ? (
                              <img
                                src={t.avatar_url}
                                alt={t.customer_name}
                                className="h-8 w-8 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary font-display text-xs font-bold text-primary-foreground">
                                {t.customer_name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold">{t.customer_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-0.5 text-yellow-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < t.rating ? "fill-current" : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs md:max-w-md text-xs text-muted-foreground">
                          <p className="leading-relaxed">"{t.message}"</p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(t.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[9px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 border ${
                              t.is_approved
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                            }`}
                          >
                            {t.is_approved ? "Approved" : "Pending Review"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {t.is_approved ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 rounded-lg"
                                onClick={() =>
                                  toggleApprovalMutation.mutate({ id: t.id, is_approved: false })
                                }
                                title="Revoke Approval"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                                onClick={() =>
                                  toggleApprovalMutation.mutate({ id: t.id, is_approved: true })
                                }
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                              onClick={() => setDeleteTarget(t)}
                              title="Delete Review"
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

              {/* Pagination */}
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

      {/* Delete Testimonial AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-surface border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Testimonial?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this testimonial from{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.customer_name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <div className="p-4 rounded-2xl border border-border/20 bg-surface/50 text-xs italic text-muted-foreground">
              "{deleteTarget.message}"
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                </>
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

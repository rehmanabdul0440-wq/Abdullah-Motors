import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Check,
  Mail,
  Search,
  Filter,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Car,
  User,
  Phone,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/enquiries")({
  component: AdminEnquiries,
});

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
  car_id: string | null;
  cars?: {
    title: string;
    slug: string;
    price: number;
  } | null;
};

function AdminEnquiries() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Fetch Enquiries from Supabase
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "enquiries", page, statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from("enquiries")
        .select("*, cars(title, slug, price)", { count: "exact" })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(`name.ilike.${q},email.ilike.${q}`);
      }

      // Range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: rows, error, count } = await query;
      if (error) throw error;

      return {
        rows: (rows || []) as unknown as Enquiry[],
        total: count || 0,
      };
    },
  });

  const enquiries = data?.rows || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 2. Update Enquiry Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "new" | "contacted" | "closed" }) => {
      const { error } = await (supabase as any)
        .from("enquiries")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Enquiry marked as ${variables.status}`);
      qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      // update detail modal state if currently open
      if (selectedEnquiry && selectedEnquiry.id === variables.id) {
        setSelectedEnquiry((prev) => prev ? { ...prev, status: variables.status } : null);
      }
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to update status");
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasFilters = search || statusFilter !== "all";

  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <h1 className="text-display-sm text-foreground">Customer Inbox</h1>
        <p className="text-body text-muted-foreground mt-1">
          Review and respond to messages regarding car listings or general requests.
        </p>
      </div>

      {/* Filters Card */}
      <Card className="glass-surface border border-border/40 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-title text-foreground">Enquiries</CardTitle>
              <CardDescription>Direct queries sent from public site forms</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="enq-search"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 rounded-xl bg-surface/50 border-border/40 focus:border-primary/50 text-sm h-10 w-full"
                />
              </div>

              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40 h-10 rounded-xl bg-surface/50 border-border/40 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Enquiries</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPage(1);
                  }}
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : enquiries.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              {hasFilters ? "No enquiries match your search criteria." : "No enquiries in inbox."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Topic / Car</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Message Preview</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Received At</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiries.map((enquiry) => (
                      <TableRow
                        key={enquiry.id}
                        className="border-b border-border/40 hover:bg-white/[0.01] cursor-pointer"
                        onClick={() => setSelectedEnquiry(enquiry)}
                      >
                        <TableCell className="font-semibold text-foreground" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <div onClick={() => setSelectedEnquiry(enquiry)}>
                            <p>{enquiry.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{enquiry.email}</p>
                            {enquiry.phone && <p className="text-[10px] text-muted-foreground">{enquiry.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {enquiry.cars?.title ? (
                            <Link
                              to="/cars/$id"
                              params={{ id: enquiry.cars.slug }}
                              className="text-primary hover:underline"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              {enquiry.cars.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">General Enquiry</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-normal text-muted-foreground">
                          "{enquiry.message}"
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(enquiry.created_at)}
                        </TableCell>
                        <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Select
                            value={enquiry.status}
                            onValueChange={(val: "new" | "contacted" | "closed") =>
                              updateStatusMutation.mutate({ id: enquiry.id, status: val })
                            }
                          >
                            <SelectTrigger
                              className={`h-7 w-28 rounded-full border text-[10px] uppercase font-bold tracking-wider px-2.5 ${
                                enquiry.status === "new"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : enquiry.status === "contacted"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                              onClick={() => setSelectedEnquiry(enquiry)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            {enquiry.status !== "closed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: enquiry.id, status: "closed" })
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
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

      {/* Enquiry Detail Modal */}
      <Dialog open={!!selectedEnquiry} onOpenChange={(open) => !open && setSelectedEnquiry(null)}>
        <DialogContent className="glass-surface max-w-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-title flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Enquiry Detail
            </DialogTitle>
            <DialogDescription>
              Received on {selectedEnquiry && formatDate(selectedEnquiry.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedEnquiry && (
            <div className="space-y-6 my-2 text-sm text-foreground">
              {/* Customer Contact */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-border/20 bg-surface/30 p-4">
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Name</p>
                    <p className="font-semibold">{selectedEnquiry.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Email</p>
                    <a href={`mailto:${selectedEnquiry.email}`} className="text-primary hover:underline font-medium">
                      {selectedEnquiry.email}
                    </a>
                  </div>
                </div>
                {selectedEnquiry.phone && (
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-caption uppercase text-muted-foreground">Phone</p>
                      <a href={`tel:${selectedEnquiry.phone}`} className="text-foreground hover:text-primary transition-colors font-medium">
                        {selectedEnquiry.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Related Car */}
              <div className="flex items-center justify-between rounded-2xl border border-border/20 bg-surface/30 p-4">
                <div className="flex items-center gap-2.5">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Listing Subject</p>
                    {selectedEnquiry.cars ? (
                      <p className="font-semibold text-foreground">{selectedEnquiry.cars.title}</p>
                    ) : (
                      <p className="font-semibold text-muted-foreground">General Website Enquiry</p>
                    )}
                  </div>
                </div>
                {selectedEnquiry.cars && (
                  <Link to="/cars/$id" params={{ id: selectedEnquiry.cars.slug }}>
                    <Button size="sm" variant="glass" className="rounded-xl">
                      View Listing
                    </Button>
                  </Link>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <p className="text-caption uppercase text-muted-foreground">Message</p>
                <div className="p-4 rounded-2xl border border-border/30 bg-background/50 whitespace-pre-wrap leading-relaxed text-foreground">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Inline status update */}
              <div className="flex items-center justify-between border-t border-border/20 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Current Status:
                  <Badge
                    className={`text-[9px] uppercase font-bold tracking-wider rounded-full px-2 py-0.5 border ${
                      selectedEnquiry.status === "new"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : selectedEnquiry.status === "contacted"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {selectedEnquiry.status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {selectedEnquiry.status !== "contacted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedEnquiry.id, status: "contacted" })
                      }
                    >
                      Mark Contacted
                    </Button>
                  )}
                  {selectedEnquiry.status !== "closed" && (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs bg-emerald-600 text-white hover:bg-emerald-500"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedEnquiry.id, status: "closed" })
                      }
                    >
                      Mark Closed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="rounded-xl w-full" onClick={() => setSelectedEnquiry(null)}>
              Close Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

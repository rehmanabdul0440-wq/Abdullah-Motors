import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  Check,
  X,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
  User,
  Phone,
  Mail,
  Car,
  BookmarkCheck,
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

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
});

type TestDriveBooking = {
  id: string;
  car_id: string;
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  cars?: {
    title: string;
    slug: string;
    price: number;
  } | null;
};

function AdminBookings() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<TestDriveBooking | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Fetch Bookings from Supabase
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bookings", page, statusFilter, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("test_drive_bookings")
        .select("*, cars(title, slug, price)", { count: "exact" })
        .order("preferred_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (startDate) {
        query = query.gte("preferred_date", startDate);
      }

      if (endDate) {
        query = query.lte("preferred_date", endDate);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: rows, error, count } = await query;
      if (error) throw error;

      return {
        rows: (rows || []) as unknown as TestDriveBooking[],
        total: count || 0,
      };
    },
  });

  const bookings = data?.rows || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 2. Update Booking Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "confirmed" | "completed" | "cancelled";
    }) => {
      const { error } = await (supabase as any)
        .from("test_drive_bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Booking ${variables.status} successfully`);
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      // Update details modal if currently open
      if (selectedBooking && selectedBooking.id === variables.id) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: variables.status } : null));
      }
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to update booking status");
    },
  });

  const hasFilters = statusFilter !== "all" || startDate || endDate;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <h1 className="text-display-sm text-foreground">Test Drives</h1>
        <p className="text-body text-muted-foreground mt-1">
          Review, approve, reschedule, or cancel test drive requests.
        </p>
      </div>

      {/* Filters Card */}
      <Card className="glass-surface border border-border/40 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-title text-foreground">Booking Requests</CardTitle>
              <CardDescription>History of all test drive appointments</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
              {/* Date Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl bg-surface/50 border-border/40 text-xs h-10 w-full sm:w-36 text-muted-foreground"
                  placeholder="Start date"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl bg-surface/50 border-border/40 text-xs h-10 w-full sm:w-36 text-muted-foreground"
                  placeholder="End date"
                />
              </div>

              {/* Status Selector */}
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl bg-surface/50 border-border/40 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStatusFilter("all");
                    setStartDate("");
                    setEndDate("");
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
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              {hasFilters ? "No bookings match these filters." : "No bookings found."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Car Requested</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Appointment</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Contact Details</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="border-b border-border/40 hover:bg-white/[0.01] cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <TableCell className="font-semibold text-foreground">
                          {booking.name}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {booking.cars?.title ? (
                            <Link
                              to="/cars/$id"
                              params={{ id: booking.cars.slug }}
                              className="text-primary hover:underline"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              {booking.cars.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">General Visit</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="text-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />{" "}
                              {formatDate(booking.preferred_date)}
                            </span>
                            <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />{" "}
                              {booking.preferred_time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="text-foreground">{booking.phone}</p>
                          <p className="text-muted-foreground">{booking.email}</p>
                        </TableCell>
                        <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Select
                            value={booking.status}
                            onValueChange={(
                              val: "pending" | "confirmed" | "completed" | "cancelled"
                            ) => updateStatusMutation.mutate({ id: booking.id, status: val })}
                          >
                            <SelectTrigger
                              className={`h-7 w-32 rounded-full border text-[10px] uppercase font-bold tracking-wider px-2.5 ${
                                booking.status === "pending"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : booking.status === "confirmed"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : booking.status === "completed"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {booking.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: booking.id, status: "confirmed" })
                                }
                                title="Confirm Booking"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {booking.status === "confirmed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: booking.id, status: "completed" })
                                }
                                title="Mark Completed"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: booking.id, status: "cancelled" })
                                }
                                title="Cancel Booking"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
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

      {/* Booking Detail Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="glass-surface max-w-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-title flex items-center gap-2">
              <BookmarkCheck className="h-5 w-5 text-primary" /> Test Drive Appointment
            </DialogTitle>
            <DialogDescription>
              Requested on {selectedBooking && formatDate(selectedBooking.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 my-2 text-sm text-foreground">
              {/* Customer Contact */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-border/20 bg-surface/30 p-4">
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Client Name</p>
                    <p className="font-semibold">{selectedBooking.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Client Email</p>
                    <a href={`mailto:${selectedBooking.email}`} className="text-primary hover:underline font-medium">
                      {selectedBooking.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Phone Number</p>
                    <a href={`tel:${selectedBooking.phone}`} className="text-foreground hover:text-primary transition-colors font-medium">
                      {selectedBooking.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-border/20 bg-surface/30 p-4">
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Preferred Date</p>
                    <p className="font-semibold">{formatDate(selectedBooking.preferred_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Preferred Time</p>
                    <p className="font-semibold">{selectedBooking.preferred_time}</p>
                  </div>
                </div>
              </div>

              {/* Related Car */}
              <div className="flex items-center justify-between rounded-2xl border border-border/20 bg-surface/30 p-4">
                <div className="flex items-center gap-2.5">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-caption uppercase text-muted-foreground">Requested Car</p>
                    {selectedBooking.cars ? (
                      <p className="font-semibold text-foreground">{selectedBooking.cars.title}</p>
                    ) : (
                      <p className="font-semibold text-muted-foreground">General Visit / No Specific Car</p>
                    )}
                  </div>
                </div>
                {selectedBooking.cars && (
                  <Link to="/cars/$id" params={{ id: selectedBooking.cars.slug }}>
                    <Button size="sm" variant="glass" className="rounded-xl">
                      View Showroom Page
                    </Button>
                  </Link>
                )}
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="space-y-1.5">
                  <p className="text-caption uppercase text-muted-foreground">Customer Notes</p>
                  <div className="p-4 rounded-2xl border border-border/30 bg-background/50 leading-relaxed text-foreground">
                    {selectedBooking.notes}
                  </div>
                </div>
              )}

              {/* Inline status update */}
              <div className="flex items-center justify-between border-t border-border/20 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Current Status:
                  <Badge
                    className={`text-[9px] uppercase font-bold tracking-wider rounded-full px-2 py-0.5 border ${
                      selectedBooking.status === "pending"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : selectedBooking.status === "confirmed"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : selectedBooking.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {selectedBooking.status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {selectedBooking.status === "pending" && (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs bg-blue-600 hover:bg-blue-500 text-white"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedBooking.id, status: "confirmed" })
                      }
                    >
                      Confirm Appointment
                    </Button>
                  )}
                  {selectedBooking.status === "confirmed" && (
                    <Button
                      size="sm"
                      className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedBooking.id, status: "completed" })
                      }
                    >
                      Mark Completed
                    </Button>
                  )}
                  {selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-xl text-xs"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedBooking.id, status: "cancelled" })
                      }
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="rounded-xl w-full" onClick={() => setSelectedBooking(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

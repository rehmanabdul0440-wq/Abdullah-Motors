import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Car,
  Calendar,
  Mail,
  MessageSquare,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
  Inbox,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { profile } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Fetch KPI Statistics
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      // Fetch cars
      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("status, is_featured");
      if (carsError) throw carsError;
      const cars = (carsData || []) as any[];

      // Fetch enquiries
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from("enquiries")
        .select("created_at, status");
      if (enquiriesError) throw enquiriesError;
      const enquiries = (enquiriesData || []) as any[];

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("test_drive_bookings")
        .select("preferred_date, status");
      if (bookingsError) throw bookingsError;
      const bookings = (bookingsData || []) as any[];

      // Fetch testimonials pending approval
      const { count: pendingTestimonials, error: testimonialsError } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);
      if (testimonialsError) throw testimonialsError;

      // Calculate KPI metrics
      const totalCars = cars?.length || 0;
      const availableCars = cars?.filter((c) => c.status === "available").length || 0;
      const soldCars = cars?.filter((c) => c.status === "sold").length || 0;

      const newEnquiriesThisWeek = enquiries?.filter(
        (e) => new Date(e.created_at) >= oneWeekAgo
      ).length || 0;

      const upcomingBookings = bookings?.filter(
        (b) => new Date(b.preferred_date) >= new Date() && b.status === "pending"
      ).length || 0;

      return {
        totalCars,
        availableCars,
        soldCars,
        newEnquiriesThisWeek,
        upcomingBookings,
        pendingTestimonials: pendingTestimonials || 0,
      };
    },
  });

  // 2. Fetch Recent Enquiries and Bookings for Activity Lists
  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ["admin", "dashboard", "activity"],
    queryFn: async () => {
      // Recent bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("test_drive_bookings")
        .select("id, name, preferred_date, preferred_time, status, cars(title)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (bookingsError) throw bookingsError;

      // Recent enquiries
      const { data: enquiries, error: enquiriesError } = await supabase
        .from("enquiries")
        .select("id, name, email, message, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);
      if (enquiriesError) throw enquiriesError;

      return {
        bookings: (bookings || []) as any[],
        enquiries: (enquiries || []) as any[],
      };
    },
  });

  // 3. Fetch Chart Data (Last 30 Days of Bookings & Enquiries)
  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ["admin", "dashboard", "chart"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch bookings in last 30 days
      const { data: bookings, error: bookingsError } = await supabase
        .from("test_drive_bookings")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (bookingsError) throw bookingsError;

      // Fetch enquiries in last 30 days
      const { data: enquiries, error: enquiriesError } = await supabase
        .from("enquiries")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (enquiriesError) throw enquiriesError;

      // Group by date
      const days: Record<string, { date: string; Enquiries: number; Bookings: number }> = {};
      
      // Initialize last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        days[d.toDateString()] = {
          date: dateStr,
          Enquiries: 0,
          Bookings: 0,
        };
      }

      const bookingsList = (bookings || []) as any[];
      const enquiriesList = (enquiries || []) as any[];

      // Populate bookings
      bookingsList.forEach((b) => {
        const dateKey = new Date(b.created_at).toDateString();
        if (days[dateKey]) {
          days[dateKey].Bookings++;
        }
      });

      // Populate enquiries
      enquiriesList.forEach((e) => {
        const dateKey = new Date(e.created_at).toDateString();
        if (days[dateKey]) {
          days[dateKey].Enquiries++;
        }
      });

      return Object.values(days);
    },
  });

  const stats = [
    {
      label: "Total Inventory",
      value: statsData?.totalCars ?? 0,
      description: `${statsData?.availableCars ?? 0} Available · ${statsData?.soldCars ?? 0} Sold`,
      icon: Car,
      color: "text-blue-500",
    },
    {
      label: "Test Drives",
      value: statsData?.upcomingBookings ?? 0,
      description: "Pending confirmations",
      icon: Calendar,
      color: "text-purple-500",
    },
    {
      label: "New Enquiries",
      value: statsData?.newEnquiriesThisWeek ?? 0,
      description: "Received this week",
      icon: Mail,
      color: "text-amber-500",
    },
    {
      label: "Pending Reviews",
      value: statsData?.pendingTestimonials ?? 0,
      description: "Awaiting approval",
      icon: MessageSquare,
      color: "text-emerald-500",
    },
  ];

  const formatActivityTime = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 600);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-8 page-transition">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-display-md text-foreground animate-fade-in">
            Welcome back,{" "}
            <span className="text-gradient-primary">{profile?.full_name || "Admin"}</span>
          </h1>
          <p className="text-body text-muted-foreground mt-1">
            Here's what's happening at Abdullah Motors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/cars/new">
            <Button className="rounded-xl bg-gradient-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-95 shadow-glow cursor-pointer">
              <Plus className="h-4 w-4" /> Add New Car
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.label}
            className="glass-surface border border-border/40 hover:border-primary/20 transition-all duration-300 shadow-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color} transition-transform duration-300 group-hover:scale-110`} />
            </CardHeader>
            <CardContent className="relative z-10">
              {isStatsLoading ? (
                <div className="h-9 w-16 bg-muted animate-pulse rounded-md" />
              ) : (
                <div className="text-4xl font-bold font-display tracking-tight text-foreground mb-1">
                  {stat.value}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Chart */}
      <Card className="glass-surface border border-border/40 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-title text-foreground">Traffic & Lead Activity</CardTitle>
            <CardDescription>Enquiries and bookings over the last 30 days</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-primary">
              <span className="h-3 w-3 rounded-full bg-primary" /> Enquiries
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="h-3 w-3 rounded-full bg-purple-500" /> Bookings
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isMounted && chartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 10, 0.9)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#ffffff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Enquiries"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEnq)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Bookings"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBook)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card className="glass-surface border border-border/40 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-title text-foreground">Upcoming Test Drives</CardTitle>
              <CardDescription>Latest bookings waiting for action</CardDescription>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activityData?.bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Inbox className="h-8 w-8 text-muted-foreground/50" /> No upcoming test drives
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {activityData?.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{booking.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Car className="h-3 w-3 inline" />{" "}
                        {booking.cars ? (booking.cars as any).title : "General inquiry"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right text-xs">
                        <p className="text-foreground">{booking.preferred_date}</p>
                        <p className="text-muted-foreground">{booking.preferred_time}</p>
                      </div>
                      <Badge
                        className={`text-[10px] uppercase font-bold tracking-wider rounded-full px-2 py-0.5 border ${
                          booking.status === "pending"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : booking.status === "confirmed"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : booking.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Enquiries */}
        <Card className="glass-surface border border-border/40 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-title text-foreground">Recent Inbox Messages</CardTitle>
              <CardDescription>Direct enquiries from customers</CardDescription>
            </div>
            <Link
              to="/admin/enquiries"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activityData?.enquiries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Inbox className="h-8 w-8 text-muted-foreground/50" /> No recent enquiries
              </div>
            ) : (
              <div className="space-y-3">
                {activityData?.enquiries.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    className="p-3.5 rounded-2xl bg-surface/30 border border-border/20 space-y-1.5 flex flex-col justify-between hover:border-primary/20 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-foreground">{enquiry.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatActivityTime(enquiry.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      "{enquiry.message}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

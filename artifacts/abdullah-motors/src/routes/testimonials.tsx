import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Star, Quote, CheckCircle2, Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { fetchApprovedTestimonials } from "@/lib/queries";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Abdullah Motors" },
      {
        name: "description",
        content: "Verified reviews from Abdullah Motors buyers across the country.",
      },
      { property: "og:title", content: "Testimonials — Abdullah Motors" },
      { property: "og:description", content: "Verified reviews from Abdullah Motors buyers." },
    ],
  }),
  component: TestimonialsPage,
});

function TestimonialsPage() {
  const { data: reviews, isLoading, isError } = useQuery({
    queryKey: ["testimonials", "approved"],
    queryFn: () => fetchApprovedTestimonials(20),
  });

  const displayReviews = reviews ?? [];

  return (
    <div className="pt-32 pb-24">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <span className="text-caption uppercase text-muted-foreground">Customer stories</span>
          <h1 className="text-display-lg mt-2 text-foreground">
            Loved by <span className="text-gradient-primary">drivers everywhere</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            {displayReviews.length}+ verified buyers · Average rating 4.9 out of 5
          </p>
        </motion.div>

        <div className="mt-10">
          <LeaveReview />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="glass-surface mt-12 h-72 animate-pulse rounded-3xl" aria-label="Loading testimonials" />
        ) : isError ? (
          <div className="glass-surface mt-12 rounded-3xl p-12 text-center">
            <p className="text-body text-muted-foreground">
              We couldn't load customer stories right now. Please check back shortly.
            </p>
          </div>
        ) : displayReviews.length === 0 ? (
          <div className="glass-surface mt-12 rounded-3xl p-12 text-center">
            <p className="text-body text-muted-foreground">
              Approved customer stories will appear here once our team has reviewed them.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayReviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.04 }}
              className="glass-surface relative flex flex-col rounded-3xl p-6"
            >
              <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/20" />
              <RatingStars value={r.rating} />
              <p className="mt-4 text-foreground/90">"{r.message}"</p>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                {r.avatar_url ? (
                  <img
                    src={r.avatar_url}
                    alt={r.customer_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
                    {r.customer_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.customer_name}</p>
                </div>
              </div>
            </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RatingStars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn("transition-transform", onChange && "cursor-pointer hover:scale-110")}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-5 w-5",
              n <= value ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}

const reviewSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters"),
  message: z.string().min(10, "Review must be at least 10 characters"),
  rating: z.number().min(1).max(5),
  phone_number_honeypot: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

function LeaveReview() {
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      customer_name: "",
      message: "",
      rating: 5,
      phone_number_honeypot: "",
    },
  });

  const onSubmit = async (values: ReviewFormValues) => {
    // Honeypot check
    if (values.phone_number_honeypot) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        reset();
        setRating(5);
      }, 3000);
      return;
    }

    const { error } = await supabase.from("testimonials").insert([
      {
        customer_name: values.customer_name,
        message: values.message,
        rating,
        is_approved: false, // always pending approval
        avatar_url: null,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    if (error) {
      toast.error(error.message || "Failed to submit review. Please try again.");
    } else {
      setSubmitted(true);
      reset();
      setRating(5);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-surface rounded-3xl p-6 md:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-heading text-foreground">Leave a review</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bought a car from us? Share your story — reviews help other drivers make confident
            decisions.
          </p>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-3 flex flex-col items-center justify-center py-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-strong)]"
            >
              <CheckCircle2 className="h-8 w-8" />
            </motion.div>
            <p className="mt-4 text-title text-foreground">Thanks for your review!</p>
            <p className="mt-2 text-body-sm text-muted-foreground max-w-xs">
              Your review is pending approval and will appear once our team has verified it.
            </p>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2 lg:col-span-3"
          >
            {/* Honeypot */}
            <input
              type="text"
              {...register("phone_number_honeypot")}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              style={{ display: "none" }}
            />

            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="rev-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rev-name"
                placeholder="Jane Doe"
                {...register("customer_name")}
                aria-invalid={!!errors.customer_name}
              />
              {errors.customer_name && (
                <p className="text-xs text-red-500">{errors.customer_name.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-1">
              <Label>Rating</Label>
              <div className="flex h-10 items-center">
                <RatingStars value={rating} onChange={setRating} />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rev-msg">
                Your review <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rev-msg"
                rows={4}
                placeholder="Tell us how it went…"
                {...register("message")}
                aria-invalid={!!errors.message}
              />
              {errors.message && (
                <p className="text-xs text-red-500">{errors.message.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Post review
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

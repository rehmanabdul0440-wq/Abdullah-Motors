import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedBlogs, type BlogRow } from "@/lib/queries";

import car1 from "@/assets/car-1.jpg";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Abdullah Journal — Car buying, culture & tech" },
      {
        name: "description",
        content:
          "Insights on car buying, ownership, EVs, and automotive culture from the Abdullah Motors team.",
      },
      { property: "og:title", content: "Abdullah Journal" },
      {
        property: "og:description",
        content: "Car buying, culture and tech insights from Abdullah Motors.",
      },
    ],
  }),
  component: BlogIndex,
});

// ---------- Helpers ----------
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function excerptFrom(content: string, maxLen = 160): string {
  const text = content.replace(/[#*_[\]`>]/g, "").trim();
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "…" : text;
}

// ---------- Skeleton ----------
function BlogSkeleton() {
  return (
    <div className="pt-32 pb-24">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl space-y-4">
          <div className="h-3 w-24 rounded bg-surface/60 animate-pulse" />
          <div className="h-10 w-2/3 rounded-lg bg-surface/60 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-surface/60 animate-pulse" />
        </div>
        <div className="glass-surface h-72 rounded-3xl animate-pulse" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-surface h-80 rounded-3xl animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}

function BlogIndex() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => fetchPublishedBlogs(),
  });

  if (isLoading) return <BlogSkeleton />;

  if (isError) {
    return (
      <div className="pt-32 pb-24">
        <section className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <BookOpen className="mx-auto h-12 w-12 text-primary/60" />
          <h1 className="mt-6 text-display-md text-foreground">The journal is taking a pause</h1>
          <p className="mx-auto mt-3 max-w-md text-body-sm text-muted-foreground">
            We couldn't load the latest articles. Please try again shortly.
          </p>
        </section>
      </div>
    );
  }

  // Fallback to static posts if DB has nothing yet
  const posts: BlogRow[] = data && data.length > 0 ? data : [];
  const [featured, ...rest] = posts;

  if (!featured) {
    return (
      <div className="pt-32 pb-24">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="text-caption uppercase text-muted-foreground">The Abdullah Journal</span>
            <h1 className="text-display-lg mt-2 text-foreground">
              Stories from the <span className="text-gradient-primary">driver's seat</span>
            </h1>
          </motion.div>
          <div className="mt-20 flex flex-col items-center gap-4 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No articles published yet — check back soon.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <span className="text-caption uppercase text-muted-foreground">The Abdullah Journal</span>
          <h1 className="text-display-lg mt-2 text-foreground">
            Stories from the <span className="text-gradient-primary">driver's seat</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            Guides, culture, and honest opinions from the team that lives and breathes cars.
          </p>
        </motion.div>

        {/* Featured */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="glass-surface group grid overflow-hidden rounded-3xl lg:grid-cols-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-surface lg:aspect-auto">
              <img
                src={featured.cover_image_url ?? car1}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-10">
              <span className="text-caption uppercase text-primary">Abdullah Journal</span>
              <h2 className="mt-3 text-display-md text-foreground">{featured.title}</h2>
              <p className="mt-4 text-muted-foreground">{excerptFrom(featured.content)}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {formatDate(featured.published_at)}
                </span>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                Read article{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Grid */}
        {rest.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => (
              <motion.article
                key={p.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="glass-surface group flex h-full flex-col overflow-hidden rounded-3xl"
                >
                  <div className="relative aspect-video overflow-hidden bg-surface">
                    <img
                      src={p.cover_image_url ?? car1}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-title text-foreground group-hover:text-gradient-primary">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {excerptFrom(p.content, 120)}
                    </p>
                    <div className="mt-auto flex items-center gap-4 pt-6 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(p.published_at)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {Math.max(1, Math.ceil(p.content.split(" ").length / 200))} min read
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

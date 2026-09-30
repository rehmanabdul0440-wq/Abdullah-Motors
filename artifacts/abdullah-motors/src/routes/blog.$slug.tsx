import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Calendar, Clock, ArrowLeft, ArrowRight, User } from "lucide-react";
import { fetchBlogBySlug, fetchPublishedBlogs, type BlogRow } from "@/lib/queries";
import car1 from "@/assets/car-1.jpg";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    if (!params.slug) throw notFound();
    const post = await fetchBlogBySlug(params.slug);
    if (!post) throw notFound();
    const allBlogs = await fetchPublishedBlogs();
    const related = allBlogs.filter((p) => p.slug !== post.slug).slice(0, 3);
    return { post, related };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Article not found — Abdullah Journal" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { post } = loaderData as { post: BlogRow };
    const excerpt = post.content.slice(0, 160) + "…";
    return {
      meta: [
        { title: `${post.title} — Abdullah Journal` },
        { name: "description", content: excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: excerpt },
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="pt-40 pb-24 text-center">
      <h1 className="text-display-md text-foreground">Article not found</h1>
      <p className="mt-2 text-muted-foreground">
        The piece you're looking for isn't in the Journal.
      </p>
      <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>
    </div>
  ),
  component: PostPage,
});

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function PostPage() {
  const { post, related } = Route.useLoaderData() as { post: BlogRow; related: BlogRow[] };

  const readingTime = Math.max(1, Math.ceil(post.content.split(" ").length / 200));
  const excerpt =
    post.content
      .replace(/[#*_[\]`>]/g, "")
      .trim()
      .slice(0, 160) + "…";

  return (
    <div className="pb-24">
      {/* Cover */}
      <section className="relative pt-24">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
          <img
            src={post.cover_image_url ?? car1}
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <span className="text-caption uppercase text-primary">Abdullah Journal</span>
            <h1 className="mt-3 text-display-lg text-foreground">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" /> {post.profiles?.full_name ?? "Abdullah Motors team"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {formatDate(post.published_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {readingTime} min read
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 overflow-hidden rounded-3xl border border-border"
          >
            <img
              src={post.cover_image_url ?? car1}
              alt={post.title}
              className="w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto mt-16 max-w-3xl px-4 sm:px-6 lg:px-8">
        <article className="space-y-6 text-body text-muted-foreground [&_h2]:mt-10 [&_h2]:text-heading [&_h2]:text-foreground [&_p]:leading-relaxed [&_strong]:text-foreground">
          <p className="text-lg leading-relaxed text-foreground/90">{excerpt}</p>
          <div className="whitespace-pre-wrap leading-relaxed">{post.content}</div>
        </article>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-heading text-foreground">Related articles</h2>
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-primary">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="glass-surface group flex flex-col overflow-hidden rounded-3xl"
              >
                <div className="relative aspect-video overflow-hidden bg-surface">
                  <img
                    src={p.cover_image_url ?? car1}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="text-caption uppercase text-primary">Abdullah Journal</span>
                  <h3 className="mt-2 line-clamp-2 text-title text-foreground">{p.title}</h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(p.published_at)}</span> ·{" "}
                    <span>
                      {Math.max(1, Math.ceil(p.content.split(" ").length / 200))} min read
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

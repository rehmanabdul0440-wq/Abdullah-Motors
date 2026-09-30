import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Award, Users, ShieldCheck, Car, Sparkles, HeartHandshake, Compass } from "lucide-react";

import heroCar from "@/assets/hero-car.jpg";
import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Abdullah Motors — Our Story & Team" },
      {
        name: "description",
        content:
          "A decade of curating premium automobiles with concierge-grade service. Meet the people behind Abdullah Motors.",
      },
      { property: "og:title", content: "About Abdullah Motors" },
      {
        property: "og:description",
        content: "A decade of curating premium automobiles with concierge-grade service.",
      },
    ],
  }),
  component: AboutPage,
});

const stats = [
  { icon: Car, value: "500+", label: "Cars Sold" },
  { icon: Users, value: "3,200+", label: "Happy Owners" },
  { icon: Award, value: "10+", label: "Years Experience" },
  { icon: ShieldCheck, value: "100%", label: "Certified" },
];

const values = [
  {
    icon: Sparkles,
    title: "Craft & Curation",
    desc: "Every vehicle in our showroom is hand-selected and painstakingly detailed.",
  },
  {
    icon: HeartHandshake,
    title: "Radical Transparency",
    desc: "Clear pricing, honest histories, no pressure — ever.",
  },
  {
    icon: Compass,
    title: "Concierge Journey",
    desc: "From first test drive to after-sales, a single specialist stays with you.",
  },
];

const team = [
  { name: "Elena Vargas", role: "Founder & CEO", image: car1 },
  { name: "Marcus Chen", role: "Head of Curation", image: car2 },
  { name: "Priya Anand", role: "Client Experience", image: car3 },
  { name: "Daniel Kessler", role: "Master Technician", image: car4 },
];

function AboutPage() {
  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 -z-10">
          <img src={heroCar} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-caption uppercase text-muted-foreground">
              About Abdullah Motors
            </span>
            <h1 className="text-display-xl mt-3 text-foreground">
              Driving <span className="text-gradient-primary">a new standard</span>
            </h1>
            <p className="mt-6 text-body text-muted-foreground">
              We built Abdullah Motors for people who love cars and hate the buying process. A decade
              in, we're still obsessed with getting every detail right.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-caption uppercase text-muted-foreground">Our Story</span>
            <h2 className="text-display-md mt-2 text-foreground">
              Started in a garage. Built on trust.
            </h2>
            <div className="mt-6 space-y-4 text-body text-muted-foreground">
              <p>
                Abdullah Motors began in 2014 as a small independent showroom obsessed with rare European
                coupes. As the world changed, so did we — adding electrified icons, luxury SUVs, and
                a team of specialists who genuinely love the craft.
              </p>
              <p>
                Today we serve enthusiasts and daily drivers across three cities, but our promise is
                unchanged: honest advice, exceptional cars, and a relationship that lasts far beyond
                the sale.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-primary opacity-20 blur-3xl" />
            <img src={car2} alt="Showroom" className="rounded-3xl border border-border" />
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-caption uppercase text-muted-foreground">What we stand for</span>
          <h2 className="text-display-md mt-2 text-foreground">Our mission & values</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-surface rounded-3xl p-8"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-[var(--shadow-glow)]">
                <v.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-6 text-title text-foreground">{v.title}</h3>
              <p className="mt-2 text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-caption uppercase text-muted-foreground">Faces of Abdullah</span>
          <h2 className="text-display-md mt-2 text-foreground">Meet the team</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-surface group overflow-hidden rounded-3xl"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                <img
                  src={m.image}
                  alt={m.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              </div>
              <div className="p-5">
                <p className="font-display text-lg font-semibold text-foreground">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-surface rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <s.icon className="h-6 w-6 text-primary" />
                <p className="mt-3 font-display text-3xl font-bold text-foreground">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

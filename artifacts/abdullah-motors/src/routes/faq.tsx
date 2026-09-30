import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Abdullah Motors" },
      {
        name: "description",
        content:
          "Answers to common questions about financing, warranty, trade-ins, test drives, and delivery.",
      },
      { property: "og:title", content: "FAQ — Abdullah Motors" },
      {
        property: "og:description",
        content: "Answers to common questions about buying with Abdullah Motors.",
      },
    ],
  }),
  component: FAQPage,
});

const GROUPS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Buying & Test Drives",
    items: [
      {
        q: "How do I book a test drive?",
        a: "Pick any car on our listings page and hit 'Book Test Drive'. Choose an in-showroom appointment or ask for a concierge test drive at your home or office.",
      },
      {
        q: "Can I reserve a car online?",
        a: "Yes — a fully refundable deposit holds any vehicle for up to 72 hours while you finalize paperwork or arrange financing.",
      },
      {
        q: "Do you offer home delivery?",
        a: "We deliver anywhere in the continental US. Local delivery within 100 mi is complimentary; longer distances are quoted transparently.",
      },
    ],
  },
  {
    title: "Financing & Trade-ins",
    items: [
      {
        q: "What financing options are available?",
        a: "We work with 12+ prime lenders offering fixed-rate loans from 36–84 months, plus balloon-payment and lease-to-own structures. Get pre-approved in minutes on our financing page.",
      },
      {
        q: "Will applying affect my credit score?",
        a: "Our pre-approval uses a soft pull that has zero impact on your credit. A hard pull only happens once you accept a final offer.",
      },
      {
        q: "Do you accept trade-ins?",
        a: "Absolutely. Submit photos and details, and we'll give you a firm written offer within 24 hours — no obligation to buy from us.",
      },
    ],
  },
  {
    title: "Warranty, Servicing & Returns",
    items: [
      {
        q: "What warranty comes with the car?",
        a: "Every certified pre-owned vehicle ships with a 12-month/12,000-mile limited warranty. Extended coverage up to 5 years is available at checkout.",
      },
      {
        q: "Where can I service my Aurora car?",
        a: "Our in-house workshop handles all makes, but the warranty is honored at any manufacturer-authorized service center nationwide.",
      },
      {
        q: "Is there a return policy?",
        a: "Yes — a 7-day/500-mile no-questions return on every purchase. Bring it back, get a full refund minus any documented damage.",
      },
      {
        q: "Do you sell insurance?",
        a: "We partner with three top-rated insurers and can bind a policy at the point of sale, usually within an hour.",
      },
    ],
  },
];

function FAQPage() {
  return (
    <div className="pt-32 pb-24">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="text-caption uppercase text-muted-foreground">Support</span>
          <h1 className="text-display-lg mt-2 text-foreground">
            Frequently asked <span className="text-gradient-primary">questions</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            Can't find what you need? Our concierge team replies within a business day.
          </p>
        </motion.div>

        <div className="mt-16 space-y-12">
          {GROUPS.map((group, gi) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.05 }}
            >
              <h2 className="text-heading text-foreground">{group.title}</h2>
              <Accordion type="single" collapsible className="mt-4">
                {group.items.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`${gi}-${i}`}
                    className="glass-surface my-2 rounded-2xl border-none px-5"
                  >
                    <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

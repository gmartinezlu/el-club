import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type FAQItem = { question: string; answer: string };

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-3xl border border-club-green/10 bg-white/35 backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="font-medium text-club-ink">{item.question}</span>
              <span className="text-club-green/80">{isOpen ? "−" : "+"}</span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="px-6 pb-5"
                >
                  <p className="text-sm leading-relaxed text-club-muted">
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Reveal } from "./reveal";

type Metric = {
  label: string;
  value: number;
  suffix: string;
  decimals?: number;
};

const metrics: Metric[] = [
  { label: "Rides completed", value: 24800, suffix: "+" },
  { label: "Active drivers", value: 1200, suffix: "+" },
  { label: "Cities", value: 12, suffix: "" },
  { label: "Average rating", value: 4.9, suffix: "/5", decimals: 1 },
];

function CountUp({ metric, start }: { metric: Metric; start: boolean }) {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(reduceMotion ? metric.value : 0);

  useEffect(() => {
    if (!start || reduceMotion) {
      setCount(metric.value);
      return;
    }

    let frame = 0;
    const durationMs = 1200;
    let startTime: number | undefined;
    const animate = (time: number) => {
      startTime ??= time;
      const progress = Math.min((time - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(metric.value * eased);
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [metric.value, reduceMotion, start]);

  return (
    <span>
      {count.toLocaleString("en-US", {
        minimumFractionDigits: metric.decimals ?? 0,
        maximumFractionDigits: metric.decimals ?? 0,
      })}
      {metric.suffix}
    </span>
  );
}

export function LiveStats() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const started = useInView(sectionRef, { once: true, amount: 0.4 }) || Boolean(reduceMotion);

  return (
    <section ref={sectionRef} id="live-stats" className="border-b border-white/[0.06] bg-white/[0.015]">
      <Reveal className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-10">
        <div
          className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-y-0"
          aria-label="RideX at a glance"
        >
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`px-3 text-center sm:px-6 ${
                index > 0 && index % 2 !== 0 ? "border-l border-white/[0.08]" : ""
              } ${index >= 2 ? "md:border-l md:border-white/[0.08]" : ""}`}
            >
              <p className="font-display text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
                <span className="sr-only">{metric.value}{metric.suffix}</span>
                <span aria-hidden="true"><CountUp metric={metric} start={started} /></span>
              </p>
              <p className="mt-2 text-xs text-zinc-500 sm:text-sm">{metric.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
      <p className="mx-auto max-w-7xl px-5 pb-4 text-center text-[10px] text-zinc-600 sm:px-8 lg:px-10">
        Illustrative platform snapshot
      </p>
    </section>
  );
}

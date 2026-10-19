"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const testimonials = [
  {
    quote: "I knew where my driver was and what the fare would be before we set off. The whole trip felt simple.",
    name: "Ananya R.",
    detail: "Rider · Pune",
  },
  {
    quote: "The ride details were clear from the start, and getting my receipt after the trip took no effort.",
    name: "Kabir M.",
    detail: "Rider · Bhopal",
  },
  {
    quote: "I can decide when to go online and see the trip information before I accept a ride.",
    name: "Meera S.",
    detail: "Driver · Indore",
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = testimonials[activeIndex];

  const changeTestimonial = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + testimonials.length) % testimonials.length);
  };

  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Rider & driver stories"
            title="Good journeys are worth sharing."
            description="A smoother trip is made of small things done well."
            centered={false}
          />
          <p className="-mt-6 text-xs text-zinc-600">Illustrative sample feedback for the RideX preview.</p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="glass relative min-h-72 rounded-3xl p-6 sm:p-9">
            <Quote aria-hidden="true" className="h-8 w-8 text-red-400/70" />
            <div aria-live="polite" aria-atomic="true">
              <div className="mt-5 flex gap-1 text-amber-300" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} aria-hidden="true" className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 min-h-24 font-display text-xl font-medium leading-8 text-white sm:text-2xl">
                “{current.quote}”
              </blockquote>
              <div className="mt-7 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">{current.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{current.detail}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous testimonial"
                    className="h-10 w-10 rounded-full border-white/10"
                    onClick={() => changeTestimonial(-1)}
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next testimonial"
                    className="h-10 w-10 rounded-full border-white/10"
                    onClick={() => changeTestimonial(1)}
                  >
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

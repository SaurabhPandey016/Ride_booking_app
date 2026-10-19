import {
  BadgeCheck,
  CreditCard,
  Headset,
  MapPinned,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FeatureCard } from "./feature-card";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const features: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Real-time tracking",
    description: "See your driver approach and keep an eye on your trip as it unfolds.",
    icon: MapPinned,
  },
  {
    title: "Secure payments",
    description: "Pay through a protected checkout and find your receipt when you need it.",
    icon: CreditCard,
  },
  {
    title: "Transparent fares",
    description: "Know your estimated fare in INR or USD before you request a ride.",
    icon: ShieldCheck,
  },
  {
    title: "Verified drivers",
    description: "Driver and vehicle details are shared with you before the trip begins.",
    icon: BadgeCheck,
  },
  {
    title: "Here when you need us",
    description: "Reach out to our support team when a trip or account needs attention.",
    icon: Headset,
  },
  {
    title: "Ratings that matter",
    description: "Share feedback after a completed ride and help the community improve.",
    icon: Star,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="Made for the whole journey"
          title="The details that make a difference."
          description="Useful tools, thoughtful safety, and clear information at every step."
        />
      </Reveal>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {features.map(({ title, description, icon: Icon }, index) => (
          <Reveal key={title} delay={(index % 3) * 0.06}>
            <FeatureCard
              icon={<Icon aria-hidden="true" className="h-5 w-5" />}
              title={title}
              description={description}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

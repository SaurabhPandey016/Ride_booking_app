import type { ReactNode } from "react";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="glass-panel p-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{description}</p>
    </article>
  );
}

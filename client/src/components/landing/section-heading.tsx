type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = true,
}: SectionHeadingProps) {
  return (
    <div className={centered ? "mx-auto mb-10 max-w-2xl text-center sm:mb-14" : "mb-10 max-w-2xl sm:mb-14"}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300 sm:text-sm">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">{description}</p>
      )}
    </div>
  );
}

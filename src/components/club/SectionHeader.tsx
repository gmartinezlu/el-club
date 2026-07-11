export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-sm font-medium text-club-green">{eyebrow}</p>
      <h2 className="mt-2 font-display text-4xl leading-tight text-club-green md:text-6xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-club-muted md:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

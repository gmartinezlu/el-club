export type ContentCardData = {
  title: string;
  category: string;
  readTime: string;
  image: string;
};

export function ContentCard({ article }: { article: ContentCardData }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-club-green/10 bg-white/50 shadow-soft backdrop-blur">
      <div className="aspect-[16/11] overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-club-muted">
          {article.category} Â· {article.readTime}
        </p>
        <h3 className="mt-3 font-display text-2xl leading-tight text-club-green">
          {article.title}
        </h3>
      </div>
    </article>
  );
}

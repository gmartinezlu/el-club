import { MarketingLayout } from "../layouts/MarketingLayout";
import { ContentCard } from "../components/club/ContentCard";
import { SectionHeader } from "../components/club/SectionHeader";
import { blogCategories, contentArticles } from "../components/club/clubContent";

export function BlogPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
        <SectionHeader
          eyebrow="Blog"
          title="Contenido para cuidar tu mente todos los dÃ­as."
          subtitle="Un magazine emocional: breve, cÃ¡lido y Ãºtil. Por ahora queda con contenido mockeado para definir lÃ­nea editorial."
        />

        <div className="mt-8 flex flex-wrap gap-2">
          {blogCategories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-club-green/10 bg-white/55 px-4 py-2 text-sm text-club-green shadow-soft"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contentArticles.map((article) => (
            <ContentCard key={article.title} article={article} />
          ))}
        </div>
      </main>
    </MarketingLayout>
  );
}

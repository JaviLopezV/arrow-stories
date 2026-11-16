import Catalog from "@/components/Catalog";
import { listStories } from "@/lib/content-store";
export const dynamic = "force-dynamic";
export default async function Home() {
  return (
    <Catalog
      books={(await listStories()).map((book) => ({
        ...book,
        cover: book.cover ? `/api/covers/${book.slug}/` : undefined,
      }))}
    />
  );
}

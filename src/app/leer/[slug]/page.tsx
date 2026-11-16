import { notFound } from "next/navigation";
import { getStoredStory } from "@/lib/content-store";
import Reader from "@/components/Reader";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: (await getStoredStory(slug))?.title ?? "Historia no encontrada",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getStoredStory(slug);
  if (!story) notFound();
  return <Reader story={story} />;
}

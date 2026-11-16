import { getStoredStory } from "@/lib/content-store";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const book = await getStoredStory(slug);
  const match = book?.cover?.match(
    /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/,
  );
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!match) return new Response(null, { status: 404, headers });
  return new Response(new Uint8Array(Buffer.from(match[2], "base64")), {
    headers: { ...headers, "Content-Type": match[1] },
  });
}

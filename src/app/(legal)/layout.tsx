import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page" lang="es">
      <Link href="/">← Volver a la biblioteca</Link>
      {children}
    </main>
  );
}

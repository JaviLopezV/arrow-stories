import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/i18n/LanguageProvider";
export const metadata: Metadata = {
  title: {
    default: "Lumbre · Historias para quedarse",
    template: "%s · Lumbre",
  },
  description:
    "Un refugio para los que se pierden entre páginas. Cuentos y relatos abiertos, sin registro.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

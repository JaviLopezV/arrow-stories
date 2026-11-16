"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { siteOwner } from "@/lib/legal";

const labels = {
  es: [
    "Información legal",
    "Aviso legal",
    "Privacidad",
    "Cookies",
    "Condiciones de envío",
    "Enviar un libro",
    "Administrar",
  ],
  ca: [
    "Informació legal",
    "Avís legal",
    "Privadesa",
    "Galetes",
    "Condicions d’enviament",
    "Envia un llibre",
    "Administra",
  ],
  en: [
    "Legal information",
    "Legal notice",
    "Privacy",
    "Cookies",
    "Submission terms",
    "Submit a book",
    "Admin",
  ],
};

export default function SiteFooter({ year }: { year: number }) {
  const { locale, t } = useLanguage();
  const [navigation, notice, privacy, cookies, terms, submit, admin] =
    labels[locale];

  return (
    <footer className="site-footer">
      <Link className="brand" href="/">
        ◒ lumbre.
      </Link>
      <span>{t.footer}</span>
      <div className="site-footer-details">
        <small>
          © {year} {siteOwner.name} · Lumbre
        </small>
        <nav aria-label={navigation}>
          <Link href="/aviso-legal">{notice}</Link>
          <Link href="/privacidad">{privacy}</Link>
          <Link href="/cookies">{cookies}</Link>
          <Link href="/condiciones-de-envio">{terms}</Link>
        </nav>
        <div className="site-footer-actions">
          <Link href="/enviar">{submit}</Link>
          <Link href="/admin">{admin}</Link>
        </div>
      </div>
    </footer>
  );
}

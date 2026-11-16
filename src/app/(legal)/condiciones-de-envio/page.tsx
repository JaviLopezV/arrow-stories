import type { Metadata } from "next";
import Link from "next/link";
import { siteOwner, submissionTermsVersion } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Condiciones de envío y publicación",
};

export default function SubmissionTerms() {
  return (
    <article>
      <h1>Condiciones de envío y publicación</h1>
      <p>
        Versión{" "}
        <time dateTime={submissionTermsVersion}>16 de noviembre de 2026</time>
      </p>
      <h2>Qué puedes enviar</h2>
      <p>
        Envía solo obras, traducciones e imágenes que hayas creado o que estés
        autorizado a publicar. Declara el nombre de autor o el seudónimo que
        debe aparecer en la ficha. Evita incluir datos personales de terceros
        salvo que tengas una base válida para hacerlo. Los contenidos ilícitos o
        que vulneren derechos de terceros pueden rechazarse o retirarse.
      </p>
      <h2>Revisión y publicación</h2>
      <p>
        Al enviar la obra, autorizas a Lumbre a almacenarla y revisarla. Con la
        aprobación del editor, autorizas su reproducción técnica y su puesta a
        disposición gratuita en la biblioteca por internet, con alcance mundial
        mientras permanezca publicada. Esta autorización es gratuita y no
        exclusiva. Conservas tus derechos sobre la obra y puedes publicarla en
        otros lugares.
      </p>
      <p>
        La revisión puede incluir un informe de apoyo de Cloudflare Workers AI
        en los términos de la{" "}
        <Link href="/privacidad">política de privacidad</Link>. El editor decide
        si la obra se publica. El formulario confirma la recepción una vez
        guardado el envío.
      </p>
      <h2>Corrección o retirada</h2>
      <p>
        Puedes solicitar una corrección o la retirada del envío o de una
        publicación escribiendo a{" "}
        <a href={`mailto:${siteOwner.email}`}>{siteOwner.email}</a> con su
        título, el nombre de autor y, si ya está publicada, su URL. La
        autorización para mostrar la obra termina con su retirada pública.
      </p>
    </article>
  );
}

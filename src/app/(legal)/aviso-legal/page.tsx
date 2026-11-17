import type { Metadata } from "next";
import { siteOwner } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso legal" };

export default function LegalNotice() {
  return (
    <article>
      <h1>Aviso legal</h1>
      <h2>Titular de Lumbre</h2>
      <dl>
        <dt>Titular</dt>
        <dd>{siteOwner.name}</dd>
        <dt>NIF</dt>
        <dd>{siteOwner.taxId}</dd>
        <dt>Domicilio</dt>
        <dd>{siteOwner.address}</dd>
        <dt>Correo electrónico</dt>
        <dd>
          <a href={`mailto:${siteOwner.email}`}>{siteOwner.email}</a>
        </dd>
      </dl>
      <h2>Uso de la biblioteca</h2>
      <p>
        Lumbre es una biblioteca digital de acceso gratuito. Se puede leer sin
        abrir una cuenta y proponer obras mediante el formulario de envío. El
        acceso, el envío de contenidos y el uso del sitio deben respetar la ley
        y los derechos de otras personas.
      </p>
      <h2>Propiedad intelectual</h2>
      <p>
        © {new Date().getFullYear()} {siteOwner.name}. Reservados los derechos
        sobre los contenidos originales de su titularidad. Las obras de
        terceros, incluidas las traducciones, ediciones e ilustraciones, se
        rigen por los derechos y licencias que les correspondan. Las obras de
        dominio público pueden utilizarse conforme a la legislación aplicable,
        respetando su autoría e integridad.
      </p>
      <p>
        Las copias disponibles para descarga en TXT y PDF están sujetas a los
        derechos y a la licencia de cada obra y de su traducción. La descarga
        permite guardar una copia para leerla sin conexión. Cualquier otro uso
        se rige por la licencia aplicable, la autorización del titular de
        derechos o los usos permitidos por la ley.
      </p>
      <h2>Comunicar una infracción</h2>
      <p>
        Escribe a <a href={`mailto:${siteOwner.email}`}>{siteOwner.email}</a> e
        indica la URL, el contenido concreto y el motivo de la reclamación. Si
        reclamas en nombre de un titular de derechos, indica quién es y acredita
        tu representación. El titular revisará el aviso y podrá restringir el
        acceso al contenido cuando proceda.
      </p>
    </article>
  );
}

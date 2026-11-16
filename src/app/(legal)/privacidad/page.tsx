import type { Metadata } from "next";
import { siteOwner } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPolicy() {
  return (
    <article>
      <h1>Política de privacidad</h1>
      <p>
        {siteOwner.name} es el responsable del tratamiento de los datos
        personales en Lumbre. Puedes contactar en {siteOwner.address} o por
        correo en <a href={`mailto:${siteOwner.email}`}>{siteOwner.email}</a>.
      </p>
      <h2>Datos, finalidades y bases jurídicas</h2>
      <ul>
        <li>
          <strong>Navegación.</strong> Las solicitudes al sitio pueden generar
          datos técnicos como la IP, la fecha y la ruta solicitada. Se usan para
          servir la web, diagnosticar errores y protegerla frente a abusos, por
          el interés legítimo de operar un servicio seguro.
        </li>
        <li>
          <strong>Envío de obras.</strong> Tratamos el título, nombre de autor o
          seudónimo, género, idioma, manuscritos y portada opcional para
          tramitar la propuesta y, si se aprueba, publicar la obra, en ejecución
          de las condiciones de envío o de las medidas previas que solicitas al
          enviarla. El título, el nombre de autor, el texto, la portada y los
          demás datos de la ficha de una obra aprobada quedan accesibles al
          público. Los campos obligatorios son necesarios para tramitar el
          envío. En producción también registramos la versión y la fecha de
          aceptación de las condiciones para acreditar el acuerdo.
        </li>
        <li>
          <strong>Consultas y reclamaciones.</strong> Usamos la dirección de
          correo y la información que incluyas para responder y gestionar la
          solicitud. La base es el interés legítimo de atender comunicaciones o
          el cumplimiento de una obligación legal cuando corresponda.
        </li>
      </ul>
      <h2>Alojamiento y revisión editorial</h2>
      <p>
        Vercel aloja el sitio y proporciona el almacenamiento privado de envíos
        mediante Vercel Blob. Si se habilita Workers AI y el editor pide una
        revisión, se envía a Cloudflare el título y el texto principal o un
        fragmento. El informe se guarda junto al resto de datos editoriales. La
        decisión de publicación la toma una persona.
      </p>
      <p>
        Estos proveedores pueden tratar datos fuera del Espacio Económico
        Europeo, incluidos los Estados Unidos. Sus acuerdos de tratamiento
        prevén mecanismos como decisiones de adecuación o cláusulas
        contractuales tipo, según el destino y el proveedor. Puedes consultar
        las garantías en los acuerdos de{" "}
        <a href="https://vercel.com/legal/dpa">Vercel</a> y{" "}
        <a href="https://www.cloudflare.com/cloudflare-customer-dpa/">
          Cloudflare
        </a>{" "}
        o solicitar más información al responsable.
      </p>
      <h2>Conservación</h2>
      <p>
        Los envíos pendientes y sus informes se conservan mientras se revisan.
        Las obras aprobadas se mantienen mientras formen parte de la biblioteca.
        Los envíos rechazados o retirados pueden permanecer en el almacenamiento
        privado durante el tiempo necesario para gestionar la retirada, atender
        reclamaciones o cumplir obligaciones legales. Las consultas se conservan
        mientras se tramitan y, cuando proceda, durante el plazo de prescripción
        aplicable. Los registros técnicos se conservan según las necesidades de
        seguridad y la configuración del alojamiento.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación, supresión, limitación, oposición y
        portabilidad cuando proceda, escribiendo a{" "}
        <a href={`mailto:${siteOwner.email}`}>{siteOwner.email}</a>. Indica el
        dato o la obra a que se refiere la solicitud. También puedes reclamar
        ante la{" "}
        <a href="https://www.aepd.es/">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>
    </article>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de cookies y almacenamiento local",
};

export default function CookiePolicy() {
  return (
    <article>
      <h1>Política de cookies y almacenamiento local</h1>
      <p>
        Lumbre usa almacenamiento local del navegador para recordar el idioma
        elegido y continuar una lectura desde la última página.
      </p>
      <dl>
        <dt>
          <code>lumbre-language</code>
        </dt>
        <dd>Guarda el idioma que eliges para las próximas visitas.</dd>
        <dt>
          <code>lumbre-last-read</code>
        </dt>
        <dd>
          Recuerda la última historia que abriste para mostrarla en portada.
        </dd>
        <dt>
          <code>lumbre-page:&lt;identificador del libro&gt;</code>
        </dt>
        <dd>
          Guarda el número de la última página leída, con una clave por libro.
        </dd>
      </dl>
      <p>
        Estas preferencias son propias de Lumbre. Se guardan en el navegador
        hasta que las borres o el navegador elimine los datos del sitio. La
        aplicación usa estas claves para prestar las funciones de lectura y
        personalización. La configuración de la aplicación no incluye cookies
        publicitarias ni herramientas de analítica.
      </p>
      <h2>Borrar las preferencias</h2>
      <p>
        Puedes eliminar o bloquear los datos de este sitio desde la sección de
        privacidad de tu navegador. Al borrarlos, Lumbre volverá al idioma
        predeterminado y perderá el progreso guardado en ese navegador.
      </p>
    </article>
  );
}

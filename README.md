# Lumbre · Arrow Stories

Biblioteca de historias con Next.js 15, React 19 y TypeScript. Sigue App Router, estructura `src/`, alias `@/*`, tipado estricto y scripts de los otros proyectos Arrow. CSS adaptable y arte SVG local.

## Desarrollo

```sh
npm install
npm run dev
```

Abre http://localhost:3000. Validación: `npm run typecheck` y `npm run build`. La compilación genera una aplicación Next.js con servidor Node.js. Iníciala con `npm start`; ya no se publica la carpeta estática `out/`.

## Contenido local

Los cuentos de partida se definen en `src/content/built-in-stories.ts` y sus textos en `src/content/classics.json`. Se publican tres cuentos de Horacio Quiroga (1878–1937) a partir de las transcripciones de [Cuentos de la selva (Buenos Aires, 1918)](https://es.wikisource.org/wiki/Cuentos_de_la_selva). Los lectores incluyen un enlace a la fuente de cada texto. Las rutas `/leer/[slug]` se resuelven en el servidor para los cuentos incorporados y los libros aprobados desde Administración.

El lector permite anterior/siguiente, flechas, selector de página, tema claro/oscuro y tamaño de letra. El progreso se guarda en localStorage con una clave por historia, únicamente en ese navegador. Las preferencias visuales duran la sesión del lector. El contenido original está empaquetado en la web; cada importación desde `/admin` añade un libro independiente.

Ilustración del bosque y portadas creadas con SVG/CSS locales; sin fuentes ni imágenes remotas.

## Idiomas

El selector de la cabecera y del lector permite cambiar entre castellano (`es`), catalán (`ca`) e inglés (`en`). La preferencia se guarda en este navegador. Traducciones de interfaz: `src/i18n/messages.ts`.

Cada historia almacena su contenido en `translations.es`, `translations.ca` y `translations.en`. Cada traducción contiene `title` y `pages` (con `number`, `chapter` y `paragraphs`). Cada libro importado incluye su idioma original (`originalLocale`). Si una traducción no existe, el lector muestra el idioma original con un aviso explícito; para los libros anteriores se utiliza castellano. Los tres cuentos incluyen el original castellano, una traducción catalana preparada para Lumbre con ayuda de traducción automática y la versión inglesa de [Arthur Livingston (1922)](https://www.gutenberg.org/ebooks/46051). Las tres versiones tienen el mismo número de páginas y se han alineado por pasajes para conservar la posición al cambiar de idioma.

El cambio de idioma conserva el número de página. Mantén alineadas las páginas entre traducciones; si una versión tiene menos páginas, el lector limita el número a la última disponible. El progreso continúa vinculado a la historia, sin duplicarse por idioma. Las rutas son estables. No hay traducción automática. Las importaciones de cada idioma pueden tener distinta paginación.

## Publicación de TXT para todos

Abre «Enviar un libro» (`/enviar`), introduce título, autor, género e idioma y sube un TXT UTF-8 de hasta 2 MB. Para publicar varias versiones juntas, marca «Multiidioma», elige el idioma principal y los adicionales y adjunta un TXT por cada idioma. Se envían en una sola petición, se pueden revisar por separado y se publican como un único libro. Puedes adjuntar una portada JPG, PNG o WebP de hasta 1 MB; si no la adjuntas, se usa una portada por género. Tras revisar la vista previa, lee y acepta las condiciones de envío y pulsa «Enviar para revisión». No se necesita cuenta ni clave y el libro aún no es público.

En «Administrar» (`/admin`), introduce `ADMIN_TOKEN` y pulsa «Ver peticiones». Puedes leer todas las páginas y aprobar o rechazar cada envío. La clave permanece en memoria. La bandeja y el contenido pendiente solo se pueden consultar con la clave. No se envían avisos por correo: pulsa «Actualizar peticiones» para comprobar si llegaron más.

Sin `DATABASE_URL`, dentro de `CONTENT_DIRECTORY` (por defecto `data/content/`), los envíos se guardan en `requests/pending/`. Aprobar mueve el archivo a `books/` y lo hace visible en el catálogo; rechazar lo mueve a `requests/rejected/`, fuera del catálogo. Ambas operaciones mueven el archivo de forma atómica y funcionan sin base de datos. Los libros ya publicados se mantienen.

Normas: capítulos con `# Título`, párrafos separados por líneas en blanco, unas 350 palabras por página. Los párrafos más largos se dividen. El texto se muestra como texto plano. Descarga `/plantilla-libro.txt` como ejemplo.

### Configuración del servidor

Copia `.env.example` a `.env.local` y define `ADMIN_TOKEN` con una clave aleatoria de al menos 32 caracteres (por ejemplo, genera una con `openssl rand -hex 32`). No la publiques ni uses un prefijo `NEXT_PUBLIC_`. Sin clave válida, la aprobación y el rechazo permanecen bloqueados.

Para desarrollar sin Neon o desplegar con almacenamiento en disco, define `CONTENT_DIRECTORY` con la ruta absoluta de un volumen persistente con permisos de escritura para Node.js. Los libros nuevos se guardan como JSON en el subdirectorio `books/`, mediante escritura atómica; las importaciones antiguas por idioma se siguen leyendo. Haz copias de seguridad de este directorio. Si hay varias instancias, todas deben compartir el mismo volumen; cada libro nuevo tiene su propio archivo con identificador único.

Despliega con `npm ci`, `npm run build`, `npm start`, HTTPS y un volumen persistente. Este almacenamiento no es adecuado para discos efímeros ni funciones serverless: para esos alojamientos se debe conectar una base de datos u objetos persistentes antes de publicar. Configura en el proxy un límite de petición de 40 MB para admitir el envoltorio JSON de hasta tres TXT y la portada y limita tanto los intentos de acceso como los envíos públicos a `POST /api/books/` para evitar spam y consumo de disco. El servidor comprueba por separado el límite de 2 MB por TXT.

### Prueba con Neon y migración desde Vercel Blob

1. Crea un proyecto de prueba en Neon con **Postgres database**. Desde **Connect**, copia la URL de la base de datos y guárdala en `.env.local` como `DATABASE_URL`. Usa un entorno de prueba separado de producción.
2. Para probar con el catálogo real, conserva en `.env.local` el `BLOB_READ_WRITE_TOKEN` del almacén privado de origen y ejecuta `npm run migrate:content -- blob`. El comando crea la tabla y copia los registros bajo `content/`, incluidos libros, portadas adjuntas, traducciones, ediciones, solicitudes, decisiones, aceptación de condiciones, estados e informes. Comprueba cada registro en Neon. Puedes reintentar un intento interrumpido. Si el destino contiene una versión diferente del mismo registro, el comando se detiene y la conserva.
3. Arranca `npm run dev` y comprueba catálogo, lector, portada y Administración. Envía un TXT de prueba y verifica el flujo de aprobación con `ADMIN_TOKEN`. Para una prueba desde Vercel, configura `DATABASE_URL` y `ADMIN_TOKEN` en **Preview** y despliega tras la importación.
4. Para cambiar producción, inicializa una base o rama separada de la prueba. Pausa las escrituras en el sitio durante la copia final y el cambio de despliegue para que no se pierdan modificaciones. Importa desde Blob y configura `DATABASE_URL` en **Production** antes de desplegar. Conserva Blob como copia del estado previo al cambio.

Para iniciar Neon sin datos editoriales, ejecuta `npm run migrate:content -- schema`. Para importar archivos del modo local en lugar de Blob, ejecuta `npm run migrate:content -- local` con el `CONTENT_DIRECTORY` correspondiente. Los cuentos de partida siguen incluidos en el código. La aplicación solo necesita `DATABASE_URL` para almacenar contenido en Neon y `ADMIN_TOKEN` para Administración. El token de Blob queda reservado a la importación.

Vercel Functions limita a 4,5 MB el cuerpo total de cada petición. En Vercel, el JSON con los TXT y la portada debe caber en ese límite.

Los libros importados tienen una ficha propia con portada según su género, autor, páginas y progreso de lectura independiente. Aparecen en búsquedas y filtros sin recompilar.

En «Libros del catálogo» del panel de administración puedes desactivar un libro para ocultar su ficha, lector y portada; activarlo vuelve a hacerlos públicos. «Eliminar» retira el libro también del panel y requiere confirmación. El contenido se conserva con su estado editorial. Inclúyelo en las copias de seguridad.

En «Administrar → Catálogo → Editar» se pueden cambiar título, autor, género, idioma, portada y texto de cualquier libro activo o desactivado. El TXT de reemplazo es opcional. Se conservan el enlace y el estado de publicación; los cambios se guardan como ediciones. Inclúyelas en las copias de seguridad.

### Información legal en producción

El pie enlaza al aviso legal, privacidad, cookies y condiciones de envío. Al cambiar las condiciones, actualiza la versión en `src/lib/legal.ts` y la fecha visible en la página. Revisa en Vercel, Neon y Cloudflare las garantías de tratamiento y los registros técnicos de la configuración de producción.

Aplica los criterios de conservación de la política de privacidad también a envíos rechazados, retirados, informes de IA y copias. La opción «Eliminar» del panel solo retira la obra del sitio. Para tramitar una supresión de datos, localiza el manuscrito por su identificador y revisa también sus ediciones, traducciones, informes de IA y copias antes de confirmar el borrado.

### Revisión de envíos con Workers AI

En Workers AI, usa **Use REST API** para crear un token de Workers AI y copiar el ID de cuenta. Configura `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` en Vercel (o en `.env.local` para probar en local). Guarda el token como variable sensible y vuelve a desplegar cuando esté configurado.

En **Administración → Envíos**, abre una historia pendiente y pulsa **Revisar con IA**. Cloudflare recibe el título y el texto del manuscrito principal. En manuscritos de más de 48.000 caracteres se revisa el comienzo y el panel lo indica. El informe se guarda en el almacenamiento privado de contenido y el administrador toma la decisión de publicar o rechazar. Con Workers Free, el servicio aplica una cuota diaria.

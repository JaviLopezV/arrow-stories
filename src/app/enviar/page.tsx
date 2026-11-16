"use client";
import Link from "next/link";
import { useState } from "react";
import BookForm from "@/components/BookForm";

export default function SubmitBook() {
  const [submitted, setSubmitted] = useState("");
  return (
    <main className="admin-page book-workspace">
      <Link href="/">← Volver a la biblioteca</Link>
      <header className="workspace-heading">
        <p className="eyebrow">LUMBRE · ENVÍO DE LIBROS</p>
        <h1>Enviar un libro</h1>
        <p>
          Comparte un cuento con los lectores de Lumbre. Puedes revisar cómo
          quedará antes de enviarlo.
        </p>
      </header>
      {submitted ? (
        <section className="admin-panel" role="status">
          <h2>Petición recibida</h2>
          <p>«{submitted}» está pendiente de revisión.</p>
          <div className="book-actions">
            <button onClick={() => setSubmitted("")}>Enviar otro libro</button>
            <Link href="/">Ver la biblioteca →</Link>
          </div>
        </section>
      ) : (
        <BookForm onSave={(result) => setSubmitted(result.title)} />
      )}
    </main>
  );
}

export const MAX_COVER_BYTES = 1024 * 1024;
export const COVER_ACCEPT = "image/jpeg,image/png,image/webp";

export function validateCover(value: unknown) {
  if (value === undefined || value === "") return undefined;
  const match =
    typeof value === "string" &&
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value,
    );
  if (!match || match[2].length > Math.ceil(MAX_COVER_BYTES / 3) * 4)
    throw new Error(
      "La portada debe ser JPG, PNG o WebP y pesar como máximo 1 MB.",
    );
  const bytes = Buffer.from(match[2], "base64");
  const valid =
    match[1] === "image/jpeg"
      ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : match[1] === "image/png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid || bytes.length > MAX_COVER_BYTES)
    throw new Error("La portada no es una imagen válida de hasta 1 MB.");
  return value as string;
}

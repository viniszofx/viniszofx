// Formatos que o servidor aceita como foto, até 5 MB.
const acceptedPhoto = /^image\/(jpeg|png|webp)$/;

/** Reduz a foto; se o aparelho não conseguir processar, usa a original quando ela já serve para envio. */
export async function preparePhoto(source: File, name = source.name) {
  try {
    return await compressImage(source, name);
  } catch {
    if (acceptedPhoto.test(source.type) && source.size <= 5 * 1024 * 1024) return source;
    throw new Error("Não foi possível usar esta foto. Tire outra ou escolha uma imagem JPEG ou PNG.");
  }
}

// Reduz fotos da câmera (muitas vezes 4–12 MB) para JPEG leve antes de enviar ou guardar offline.
export async function compressImage(source: Blob, name = "foto.jpg", maxSide = 1600, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível processar a imagem.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Não foi possível processar a imagem.");
  return new File([blob], name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

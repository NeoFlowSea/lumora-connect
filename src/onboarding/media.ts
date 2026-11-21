import { t } from "../i18n";
import type { FileRef } from "../api/types";

/* Files in the preview live inside the browser DB as data URLs, so they are kept small:
   photos and logos are downscaled on a canvas, CVs are capped at 1.5 MB. */

const IMAGE_LIMIT = 400_000; // characters of data URL, about 300 KB of image
export const CV_LIMIT = 1_490_000; // bytes; stays under the API's 2,000,000 character cap once base64 encoded

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(t("profile.file.notImage")));
    img.src = src;
  });
}

/** read an image, fit it into max x max pixels and return a JPEG or PNG data URL under ~300 KB */
export async function imageToDataUrl(file: File, max = 512): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(t("profile.file.notImage"));
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(t("profile.file.notImage"));
    const keepAlpha = file.type === "image/png" || file.type === "image/webp" || file.type === "image/svg+xml";
    if (keepAlpha) {
      ctx.drawImage(img, 0, 0, w, h);
      const png = canvas.toDataURL("image/png");
      if (png.length <= IMAGE_LIMIT) return png;
    }
    // JPEG has no transparency: paint a white base first so transparent logos stay readable
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    let q = 0.86;
    let out = canvas.toDataURL("image/jpeg", q);
    while (out.length > IMAGE_LIMIT && q > 0.4) {
      q -= 0.12;
      out = canvas.toDataURL("image/jpeg", q);
    }
    if (out.length > IMAGE_LIMIT) throw new Error(t("profile.file.tooBig"));
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** read a PDF into a FileRef */
export function pdfToFileRef(file: File): Promise<FileRef> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return Promise.reject(new Error(t("profile.cv.notPdf")));
  if (file.size > CV_LIMIT) return Promise.reject(new Error(t("profile.cv.tooBig")));
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, size: file.size, dataUrl: String(r.result) });
    r.onerror = () => reject(new Error(t("common.state.error")));
    r.readAsDataURL(file);
  });
}

/** "1.2 MB" / "340 KB" */
export function fileSize(bytes: number, loc: string): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toLocaleString(loc, { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1000)).toLocaleString(loc)} KB`;
}

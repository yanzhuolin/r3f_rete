import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const types: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml" };

export async function GET(_: Request, { params }: { params: { filename: string } }) {
  const filename = path.basename(params.filename);
  if (filename !== params.filename) return new NextResponse("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "public", "uploads", filename));
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    return new NextResponse(file, { headers: { "Content-Type": types[extension] || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

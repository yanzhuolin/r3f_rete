import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { currentUser, cleanName } from "../../../lib/auth";
import { createOrder, listOrders } from "../../../lib/store";
export async function GET() { return NextResponse.json({ orders: await listOrders() }); }
export async function POST(request: Request) {
  const username = currentUser(); if (!username) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const contentType = request.headers.get("content-type") || "";
  let reward = ""; let imageUrl: string | undefined;
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    reward = cleanName(form.get("reward"));
    const image = form.get("image");
    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) return NextResponse.json({ error: "只能上传图片文件" }, { status: 400 });
      if (image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "图片不能超过 5MB" }, { status: 400 });
      const extension = image.type.split("/")[1]?.replace("jpeg", "jpg") || "bin";
      const filename = `${randomUUID()}.${extension}`;
      await mkdir(path.join(process.cwd(), "public", "uploads"), { recursive: true });
      await writeFile(path.join(process.cwd(), "public", "uploads", filename), Buffer.from(await image.arrayBuffer()));
      imageUrl = `/api/uploads/${filename}`;
    }
  } else {
    const body = await request.json().catch(() => ({})); reward = cleanName(body.reward);
  }
  if (!reward) return NextResponse.json({ error: "请输入奖励内容" }, { status: 400 });
  return NextResponse.json({ order: await createOrder(reward, username, imageUrl) }, { status: 201 });
}

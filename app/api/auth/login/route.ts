import { NextResponse } from "next/server";
import { cleanName } from "../../../../lib/auth";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})); const username = cleanName(body.username);
  if (!username) return NextResponse.json({ error: "请输入用户名" }, { status: 400 });
  const response = NextResponse.json({ username }); response.cookies.set("roll_user", username, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" }); return response;
}

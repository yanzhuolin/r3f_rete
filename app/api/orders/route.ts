import { NextResponse } from "next/server";
import { currentUser, cleanName } from "../../../lib/auth";
import { createOrder, listOrders } from "../../../lib/store";
export async function GET() { return NextResponse.json({ orders: await listOrders() }); }
export async function POST(request: Request) {
  const username = currentUser(); if (!username) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => ({})); const reward = cleanName(body.reward);
  if (!reward) return NextResponse.json({ error: "请输入奖励内容" }, { status: 400 });
  return NextResponse.json({ order: await createOrder(reward, username) }, { status: 201 });
}

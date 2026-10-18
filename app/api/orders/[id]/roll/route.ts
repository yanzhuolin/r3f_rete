import { NextResponse } from "next/server";
import { currentUser } from "../../../../../lib/auth";
import { addRoll } from "../../../../../lib/store";
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const username = currentUser(); if (!username) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => ({})); const score = Number(body.score);
  if (!Number.isInteger(score) || score < 1 || score > 100) return NextResponse.json({ error: "Roll 点必须是 1-100 的整数" }, { status: 400 });
  const result = await addRoll(params.id, username, score);
  if (result.error === "NOT_FOUND") return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (result.error === "ROLL_CLOSED") return NextResponse.json({ error: "Roll 点时间已结束，请等待自动结算", order: result.order }, { status: 409 });
  if (result.error === "SETTLED") return NextResponse.json({ error: "订单已经结算，不能继续 Roll", order: result.order }, { status: 409 });
  if (result.error === "ALREADY_ROLLED") return NextResponse.json({ error: "你已经在这个订单中 Roll 过了", order: result.order }, { status: 409 });
  return NextResponse.json(result, { status: 201 });
}

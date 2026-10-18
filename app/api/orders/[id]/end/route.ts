import { NextResponse } from "next/server";
import { currentUser } from "../../../../../lib/auth";
import { endOrder } from "../../../../../lib/store";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const result = await endOrder(params.id, username);
  if (result.error === "NOT_FOUND") return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (result.error === "FORBIDDEN") return NextResponse.json({ error: "只有订单发起者可以结束订单" }, { status: 403 });
  if (result.error === "NOT_SETTLED") return NextResponse.json({ error: "订单还未自动结算，暂时不能结束" }, { status: 409 });
  if (result.error === "ALREADY_ENDED") return NextResponse.json({ error: "订单已经结束", order: result.order }, { status: 409 });
  return NextResponse.json(result);
}

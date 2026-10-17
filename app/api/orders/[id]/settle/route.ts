import { NextResponse } from "next/server";
import { currentUser } from "../../../../../lib/auth";
import { settleOrder } from "../../../../../lib/store";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const result = await settleOrder(params.id, username);
  if (result.error === "NOT_FOUND") return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (result.error === "FORBIDDEN") return NextResponse.json({ error: "只有订单发起者可以结算" }, { status: 403 });
  if (result.error === "ALREADY_SETTLED") return NextResponse.json({ error: "订单已经结算", order: result.order }, { status: 409 });
  return NextResponse.json(result);
}

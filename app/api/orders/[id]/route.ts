import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { deleteOrder, getOrder } from "../../../../lib/store";
export async function GET(_: Request, { params }: { params: { id: string } }) { const order = await getOrder(params.id); return order ? NextResponse.json({ order }) : NextResponse.json({ error: "订单不存在" }, { status: 404 }); }
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const username = currentUser();
  if (!username) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const result = await deleteOrder(params.id, username);
  if (result.error === "NOT_FOUND") return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (result.error === "FORBIDDEN") return NextResponse.json({ error: "只能删除自己创建的订单" }, { status: 403 });
  return NextResponse.json({ success: true });
}

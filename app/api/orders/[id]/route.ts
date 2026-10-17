import { NextResponse } from "next/server";
import { getOrder } from "../../../../lib/store";
export async function GET(_: Request, { params }: { params: { id: string } }) { const order = await getOrder(params.id); return order ? NextResponse.json({ order }) : NextResponse.json({ error: "订单不存在" }, { status: 404 }); }

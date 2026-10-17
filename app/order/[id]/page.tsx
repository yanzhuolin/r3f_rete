"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Roll = { username: string; score: number };
type Order = { id: string; reward: string; creator: string; settled?: boolean; rolls: Roll[] };

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("roll_user");
    if (!saved) { router.replace(`/login?from=/order/${id}`); return; }
    setUser(saved);
    fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => d.order && setOrder(d.order));
  }, [id, router]);

  async function roll() {
    setError("");
    const score = Math.floor(Math.random() * 100) + 1;
    const response = await fetch(`/api/orders/${id}/roll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error); if (data.order) setOrder(data.order); return; }
    setResult(data.roll.score); setOrder(data.order);
  }

  async function settle() {
    if (!confirm("结算后将不能再 Roll，确定要结算吗？")) return;
    setError(""); setSettling(true);
    const response = await fetch(`/api/orders/${id}/settle`, { method: "POST" });
    const data = await response.json(); setSettling(false);
    if (!response.ok) { setError(data.error); if (data.order) setOrder(data.order); return; }
    setOrder(data.order);
  }

  function copyLink() { navigator.clipboard?.writeText(`${location.origin}/order/${id}`); alert("订单链接已复制"); }

  if (!order) return <div className="share-page"><div className="card share-card">正在加载订单…</div></div>;
  const already = order.rolls.some((item) => item.username.toLowerCase() === user.toLowerCase());
  const winner = order.rolls.length ? order.rolls.reduce((best, current) => current.score > best.score ? current : best) : null;
  const isCreator = order.creator.toLowerCase() === user.toLowerCase();

  return <div className="share-page">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, gap: 12 }}>
      <div className="brand"><div className="logo">↯</div>Roll 点订单</div>
      <button className="secondary link-btn" onClick={() => router.push("/")}>← 返回首页</button>
    </div>
    <div className="card share-card">
      <div className="eyebrow">ORDER DETAIL</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap" }}>
        <div><h1>{order.reward}</h1><p className="sub">由 {order.creator} 发起 · 每人只有一次机会</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isCreator && !order.settled && <button className="primary link-btn" onClick={settle} disabled={settling}>{settling ? "结算中…" : "结算订单"}</button>}
          <button className="secondary link-btn" onClick={copyLink}>复制分享链接</button>
        </div>
      </div>
      {order.settled && <div className="notice" style={{ background: "#fff4d8", color: "#855d00" }}>订单已结算{winner ? `，最高分是 ${winner.username} 的 ${winner.score} 点` : "，暂无参与记录"}。</div>}
      {!order.settled && result !== null && <div className="score-box"><div className="sub" style={{ textAlign: "center" }}>你的 Roll 点数</div><div className="score-result">{result}</div></div>}
      {!order.settled && result === null && already && <div className="notice">你已经 Roll 过了，不能重复参与。你的记录已保存在下方。</div>}
      {!order.settled && result === null && !already && <div className="score-box"><div className="sub" style={{ textAlign: "center", marginBottom: 16 }}>点击按钮，系统将自动生成 1–100 的随机点数</div><button className="primary" style={{ width: "100%" }} onClick={roll}>开始 Roll 点　↯</button></div>}
      {error && <div className="error">{error}</div>}
      <div className="rolls"><div className="section-head"><h2>参与记录</h2><span className="count">{order.rolls.length} 人</span></div>
        {order.rolls.length === 0 ? <div className="notice">还没有人 Roll，成为第一个参与者吧。</div> : order.rolls.map((item, index) => <div className="roll-item" key={`${item.username}-${index}`}><span>{item.username}{order.settled && winner?.username === item.username && <span className="tag" style={{ marginLeft: 8 }}>最高分</span>}</span><span className="roll-score">{item.score} 点</span></div>)}
      </div>
    </div>
  </div>;
}

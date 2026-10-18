"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Roll = { username: string; score: number };
type Order = { id: string; reward: string; creator: string; imageUrl?: string; settled?: boolean; ended?: boolean; rollEndsAt?: string; settleAt?: string; rolls: Roll[] };

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollingScore, setRollingScore] = useState(1);
  const [settling, setSettling] = useState(false);
  const [ending, setEnding] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem("roll_user");
    if (!saved) { router.replace(`/login?from=/order/${id}`); return; }
    setUser(saved);
    const load = () => fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => d.order && setOrder(d.order));
    load();
    const timer = window.setInterval(() => { setNow(Date.now()); load(); }, 1000);
    return () => window.clearInterval(timer);
  }, [id, router]);

  async function roll() {
    if (rolling) return;
    setError("");
    setRolling(true);
    const timer = window.setInterval(() => setRollingScore(Math.floor(Math.random() * 100) + 1), 80);
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    window.clearInterval(timer);
    const score = Math.floor(Math.random() * 100) + 1;
    setRollingScore(score);
    const response = await fetch(`/api/orders/${id}/roll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score }) });
    const data = await response.json();
    if (!response.ok) { setRolling(false); setError(data.error); if (data.order) setOrder(data.order); return; }
    setRolling(false);
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

  async function endOrder() {
    if (!confirm("确认已完成发货并结束这个订单吗？")) return;
    setError(""); setEnding(true);
    const response = await fetch(`/api/orders/${id}/end`, { method: "POST" });
    const data = await response.json(); setEnding(false);
    if (!response.ok) { setError(data.error); if (data.order) setOrder(data.order); return; }
    setOrder(data.order);
  }

  async function copyLink() {
    const link = `${location.origin}/order/${id}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus(); textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!copied) throw new Error("copy failed");
      }
      alert("订单链接已复制");
    } catch {
      setError(`复制失败，请手动复制：${link}`);
    }
  }

  if (!order) return <div className="share-page"><div className="card share-card">正在加载订单…</div></div>;
  const already = order.rolls.some((item) => item.username.toLowerCase() === user.toLowerCase());
  const winner = order.rolls.length ? order.rolls.reduce((best, current) => current.score > best.score ? current : best) : null;
  const isCreator = order.creator.toLowerCase() === user.toLowerCase();
  const rollOpen = !order.settled && (!order.rollEndsAt || Date.parse(order.rollEndsAt) > now);
  const secondsLeft = order.rollEndsAt ? Math.max(0, Math.ceil((Date.parse(order.rollEndsAt) - now) / 1000)) : 0;

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
          {isCreator && !order.settled && !order.settleAt && <button className="primary link-btn" onClick={settle} disabled={settling}>{settling ? "结算中…" : "结算订单"}</button>}
          {isCreator && order.settled && !order.ended && <button className="primary link-btn" onClick={endOrder} disabled={ending}>{ending ? "结束中…" : "完成发货并结束"}</button>}
          <button className="secondary link-btn" onClick={copyLink}>复制分享链接</button>
        </div>
      </div>
      {order.ended && <div className="notice" style={{ background: "#e9f8ef", color: "#247044" }}>订单已结束。</div>}
      {order.settled && !order.ended && <div className="notice" style={{ background: "#fff4d8", color: "#855d00" }}>订单已自动结算{winner ? `，最高分是 ${winner.username} 的 ${winner.score} 点` : "，暂无参与记录"}。请发起者完成发货后结束订单。</div>}
      {!order.settled && !rollOpen && <div className="notice" style={{ background: "#fff4d8", color: "#855d00" }}>Roll 点已截止，订单正在自动结算{order.settleAt ? `（${new Date(order.settleAt).toLocaleTimeString()}）` : ""}。</div>}
      {order.imageUrl && <img className="detail-image" src={order.imageUrl} alt="奖励图片" />}
      {!order.settled && result !== null && <div className="score-box"><div className="sub" style={{ textAlign: "center" }}>你的 Roll 点数</div><div className="score-result">{result}</div></div>}
      {!order.settled && rollOpen && result === null && already && <div className="notice">你已经 Roll 过了，不能重复参与。你的记录已保存在下方。</div>}
      {!order.settled && rollOpen && result === null && !already && <div className="score-box"><div className="sub" style={{ textAlign: "center", marginBottom: 16 }}>{rolling ? "骰子滚动中…" : `点击按钮，系统将自动生成 1–100 的随机点数${secondsLeft ? `（剩余 ${secondsLeft} 秒）` : ""}`}</div>{rolling && <div className="dice-result">{rollingScore}</div>}<button className="primary" style={{ width: "100%" }} onClick={roll} disabled={rolling}>{rolling ? "Rolling…" : "开始 Roll 点　↯"}</button></div>}
      {error && <div className="error">{error}</div>}
      <div className="rolls"><div className="section-head"><h2>参与记录</h2><span className="count">{order.rolls.length} 人</span></div>
        {order.rolls.length === 0 ? <div className="notice">还没有人 Roll，成为第一个参与者吧。</div> : order.rolls.map((item, index) => <div className="roll-item" key={`${item.username}-${index}`}><span>{item.username}{order.settled && winner?.username === item.username && <span className="tag" style={{ marginLeft: 8 }}>最高分</span>}</span><span className="roll-score">{item.score} 点</span></div>)}
      </div>
    </div>
  </div>;
}

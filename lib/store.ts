import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type Roll = { username: string; score: number; createdAt: string };
export type Order = { id: string; reward: string; creator: string; createdAt: string; rolls: Roll[]; settled: boolean; settledAt?: string; ended?: boolean; endedAt?: string; rollEndsAt?: string; settleAt?: string; imageUrl?: string };
type Store = { orders: Order[] };

const file = path.join(process.cwd(), "data", "store.json");

async function readStore(): Promise<Store> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as Store; }
  catch { return { orders: [] }; }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

function syncOrder(order: Order) {
  if (!order.settled && order.settleAt && Date.now() >= Date.parse(order.settleAt)) {
    order.settled = true; order.settledAt = new Date().toISOString(); return true;
  }
  return false;
}
export async function listOrders() { const store = await readStore(); const changed = store.orders.some(syncOrder); if (changed) await writeStore(store); return store.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export async function createOrder(reward: string, creator: string, imageUrl?: string) {
  const store = await readStore();
  const createdAt = new Date();
  const rollEndsAt = new Date(createdAt.getTime() + 20_000).toISOString();
  const order: Order = { id: randomUUID().replaceAll("-", "").slice(0, 12), reward, creator, createdAt: createdAt.toISOString(), rolls: [], settled: false, rollEndsAt, settleAt: rollEndsAt, imageUrl };
  store.orders.push(order); await writeStore(store); return order;
}
export async function getOrder(id: string) { const store = await readStore(); const order = store.orders.find((item) => item.id === id) ?? null; if (order && syncOrder(order)) await writeStore(store); return order; }
export async function addRoll(id: string, username: string, score: number) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === id);
  if (!order) return { error: "NOT_FOUND" as const };
  const now = Date.now();
  if (!order.settled && order.settleAt && now >= Date.parse(order.settleAt)) { order.settled = true; order.settledAt = new Date().toISOString(); }
  if (order.settled) { await writeStore(store); return { error: "SETTLED" as const, order }; }
  if (order.rollEndsAt && now >= Date.parse(order.rollEndsAt)) return { error: "ROLL_CLOSED" as const, order };
  if (order.rolls.some((roll) => roll.username.toLowerCase() === username.toLowerCase())) return { error: "ALREADY_ROLLED" as const, order };
  const roll = { username, score, createdAt: new Date().toISOString() };
  order.rolls.push(roll); await writeStore(store); return { order, roll };
}
export async function settleOrder(id: string, username: string) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === id);
  if (!order) return { error: "NOT_FOUND" as const };
  if (order.creator.toLowerCase() !== username.toLowerCase()) return { error: "FORBIDDEN" as const, order };
  if (order.settled) return { error: "ALREADY_SETTLED" as const, order };
  order.settled = true; order.settledAt = new Date().toISOString(); await writeStore(store); return { order };
}

export async function endOrder(id: string, username: string) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === id);
  if (!order) return { error: "NOT_FOUND" as const };
  if (order.creator.toLowerCase() !== username.toLowerCase()) return { error: "FORBIDDEN" as const, order };
  if (!order.settled) return { error: "NOT_SETTLED" as const, order };
  if (order.ended) return { error: "ALREADY_ENDED" as const, order };
  order.ended = true; order.endedAt = new Date().toISOString(); await writeStore(store); return { order };
}

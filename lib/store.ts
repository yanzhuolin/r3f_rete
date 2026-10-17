import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type Roll = { username: string; score: number; createdAt: string };
export type Order = { id: string; reward: string; creator: string; createdAt: string; rolls: Roll[]; settled: boolean; settledAt?: string };
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

export async function listOrders() { return (await readStore()).orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export async function createOrder(reward: string, creator: string) {
  const store = await readStore();
  const order: Order = { id: randomUUID().replaceAll("-", "").slice(0, 12), reward, creator, createdAt: new Date().toISOString(), rolls: [], settled: false };
  store.orders.push(order); await writeStore(store); return order;
}
export async function getOrder(id: string) { return (await readStore()).orders.find((item) => item.id === id) ?? null; }
export async function addRoll(id: string, username: string, score: number) {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === id);
  if (!order) return { error: "NOT_FOUND" as const };
  if (order.settled) return { error: "SETTLED" as const, order };
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

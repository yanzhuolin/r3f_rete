import { cookies } from "next/headers";

export function currentUser() { return cookies().get("roll_user")?.value || ""; }
export function cleanName(name: unknown) { return typeof name === "string" ? name.trim().slice(0, 24) : ""; }

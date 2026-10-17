import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Roll 点订单", description: "简单、公平的 Roll 点活动" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body>{children}</body></html>; }

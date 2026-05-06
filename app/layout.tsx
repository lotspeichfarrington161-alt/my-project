import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Robotaxi AI 旅行助手",
  description: "滴滴 Robotaxi 智能座舱 · AI 旅行行程规划助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}

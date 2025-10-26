"use client";

import { MobileLayout } from "@/components/ui/mobile-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileLayout>{children}</MobileLayout>;
}

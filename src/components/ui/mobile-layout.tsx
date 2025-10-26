"use client";

import { useState } from "react";
import { BottomNavigation } from "./bottom-navigation";
import { QuickActionsSheet } from "./quick-actions-sheet";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <>
      {children}
      <BottomNavigation
        onQuickActionsOpen={() => setIsQuickActionsOpen(true)}
      />
      <QuickActionsSheet
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
      />
    </>
  );
}

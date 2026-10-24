'use client';

import { Heart } from 'lucide-react';

export function RohitCredit() {
  return (
    <div className="fixed bottom-3 right-3 z-[60] select-none pointer-events-none">
      <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-lg backdrop-blur-md animate-fade-in-fast">
        <span>created and managed by Rohit</span>
        <Heart className="h-3 w-3 fill-primary text-primary" />
      </div>
    </div>
  );
}

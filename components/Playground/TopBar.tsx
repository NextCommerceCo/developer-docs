'use client';

import { Check, Link, Menu, RotateCcw, Settings } from 'lucide-react';
import React from 'react';

interface TopBarProps {
  onMenuOpen?: () => void;
  onReset: () => void;
  onShare: () => void;
  onConfigOpen: () => void;
  copied: boolean;
}

export function TopBar({ onMenuOpen, onReset, onShare, onConfigOpen, copied }: TopBarProps) {
  return (
    <header className="flex items-center gap-2 md:gap-3 px-3 md:px-4 h-12 border-b border-fd-border shrink-0">
      {onMenuOpen && (
        <button
          type="button"
          onClick={onMenuOpen}
          className="md:hidden flex items-center justify-center p-1.5 text-fd-foreground hover:bg-fd-muted rounded-md"
          aria-label="Open examples"
        >
          <Menu size={16} />
        </button>
      )}
      <a href="/" className="flex items-center">
        <img src="/next-white.svg" alt="Next Commerce" className="hidden h-auto w-24 dark:block" />
        <img src="/next-dark.svg" alt="Next Commerce" className="block h-auto w-24 dark:hidden" />
      </a>
      <span className="text-fd-border hidden sm:inline">|</span>
      <span className="font-semibold text-sm hidden sm:inline">Playground</span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-fd-border hover:bg-fd-muted rounded-md text-fd-foreground"
        >
          <RotateCcw size={11} /> Reset
        </button>
        <button
          type="button"
          onClick={onShare}
          title="Copy share link"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-fd-border hover:bg-fd-muted rounded-md text-fd-foreground"
        >
          {copied ? <Check size={11} className="text-emerald-500" /> : <Link size={11} />}
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button
          type="button"
          onClick={onConfigOpen}
          title="SDK configuration"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-fd-border hover:bg-fd-muted rounded-md text-fd-foreground"
        >
          <Settings size={11} /> Config
        </button>
      </div>
    </header>
  );
}

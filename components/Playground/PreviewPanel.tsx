'use client';

import { Code2, ExternalLink, RotateCcw } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { sdkHostLabel } from '@/lib/playground/utils';
import { MIN_PREVIEW_WIDTH } from '@/lib/playground/constants';
import type { Config } from '@/lib/playground/types';

interface PreviewPanelProps {
  iframeSrc: string;
  reloadNonce?: number;
  isDark?: boolean;
  isDragging?: boolean;
  previewWidth: number | null;
  onPreviewWidthChange: (w: number | null) => void;
  onExpandToggle?: () => void;
  expanded?: boolean;
  config?: Config;
  code?: string;
  layout?: string;
}

export function PreviewPanel({
  iframeSrc,
  reloadNonce = 0,
  isDark,
  isDragging,
  previewWidth,
  onPreviewWidthChange,
  onExpandToggle,
  expanded,
  config,
}: PreviewPanelProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  const startResize = useCallback(
    (side: 'left' | 'right', startEvent: React.PointerEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      startEvent.preventDefault();
      (startEvent.target as Element).setPointerCapture?.(startEvent.pointerId);

      const stageRect = stage.getBoundingClientRect();
      const stageWidth = stageRect.width;
      const center = stageRect.left + stageWidth / 2;
      setResizing(true);

      const onMove = (ev: PointerEvent) => {
        // Symmetric resize: width = 2 * distance from center to the dragged edge.
        const distance = side === 'right' ? ev.clientX - center : center - ev.clientX;
        const next = Math.max(
          MIN_PREVIEW_WIDTH,
          Math.min(stageWidth, Math.round(distance * 2)),
        );
        setLiveWidth(next);
        onPreviewWidthChange(next >= stageWidth ? null : next);
      };

      const onUp = () => {
        setResizing(false);
        setLiveWidth(null);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [onPreviewWidthChange],
  );

  const resetWidth = useCallback(() => {
    onPreviewWidthChange(null);
  }, [onPreviewWidthChange]);

  const displayWidth = liveWidth ?? previewWidth;
  const widthLabel = displayWidth ? `${displayWidth}px` : 'Full';

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-fd-muted/20">
      <div className="px-3 py-1.5 border-b border-fd-border bg-fd-muted/30 flex items-center gap-2 min-w-0">
        {onExpandToggle && (
          <button
            type="button"
            title={expanded ? 'Show code editor' : 'Hide code editor'}
            aria-pressed={!expanded}
            onClick={onExpandToggle}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium shrink-0 transition-colors ${
              expanded
                ? 'text-fd-muted-foreground hover:text-fd-foreground border border-fd-border'
                : 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent'
            }`}
          >
            <Code2 size={13} /> Code
          </button>
        )}
        <span className="text-xs text-fd-muted-foreground font-mono shrink-0">Preview</span>
        <span className="text-[11px] text-fd-muted-foreground font-mono shrink-0 tabular-nums">
          {widthLabel}
        </span>

        <div className="ml-auto flex items-center gap-2 justify-end shrink-0">
          {config?.sdkHost && (
            <span
              title={`SDK Host: ${config.sdkHost}`}
              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-mono hidden xl:inline truncate max-w-24"
            >
              {sdkHostLabel(config.sdkHost)}
            </span>
          )}
          {previewWidth !== null && (
            <button
              type="button"
              title="Reset preview width"
              onClick={resetWidth}
              className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {iframeSrc && (
            <button
              type="button"
              title="Open preview in new tab"
              onClick={() => window.open(iframeSrc, '_blank')}
              className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stage — iframe centred with drag handles sitting on its inner edges */}
      <div
        ref={stageRef}
        className="relative flex-1 min-h-0 overflow-hidden flex justify-center items-stretch"
        style={{
          backgroundColor: isDark ? '#0f1117' : '#f1f5f9',
          backgroundImage: isDark
            ? 'radial-gradient(circle, #2d3748 1px, transparent 1px)'
            : 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div
          className="relative h-full transition-[width] duration-75 ease-out"
          style={{
            width: displayWidth ? `${displayWidth}px` : '100%',
            maxWidth: '100%',
            minWidth: 0,
            background: '#0a1f4933',
          }}
        >
          {iframeSrc && (
            <iframe
              key={`${iframeSrc}#${reloadNonce}`}
              src={iframeSrc}
              title="Preview"
              className="w-full h-full border-0 rounded"
              style={isDragging || resizing ? { pointerEvents: 'none' } : undefined}
            />
          )}

          {/* Left drag handle — sits on iframe's left edge */}
          <button
            type="button"
            aria-label="Resize preview from left"
            onPointerDown={(e) => startResize('left', e)}
            onDoubleClick={resetWidth}
            className="group absolute left-0 top-0 h-full w-3 z-10 cursor-col-resize select-none touch-none hidden md:flex items-center justify-center"
          >
            <span
              className={`block h-12 w-1.5 rounded-full transition-colors ${
                resizing
                  ? 'bg-blue-500'
                  : 'bg-fd-border group-hover:bg-blue-500'
              }`}
            />
          </button>

          {/* Right drag handle — sits on iframe's right edge */}
          <button
            type="button"
            aria-label="Resize preview from right"
            onPointerDown={(e) => startResize('right', e)}
            onDoubleClick={resetWidth}
            className="group absolute right-0 top-0 h-full w-3 z-10 cursor-col-resize select-none touch-none hidden md:flex items-center justify-center"
          >
            <span
              className={`block h-12 w-1.5 rounded-full transition-colors ${
                resizing
                  ? 'bg-blue-500'
                  : 'bg-fd-border group-hover:bg-blue-500'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

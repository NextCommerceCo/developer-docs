import { useCallback } from 'react';
import { buildPreviewUrl } from '@/lib/playground/utils';
import type { Config } from '@/lib/playground/types';
import type { PlaygroundExample } from '@/lib/playground';

export function usePreviewUpdater(
  onIframeSrcChange: (src: string) => void,
  currentExample: PlaygroundExample,
): {
  runPreview: (html: string, cfg: Config, lyt: string) => void;
} {
  const runPreview = useCallback(
    (html: string, cfg: Config, _lyt: string) => {
      const url = buildPreviewUrl(
        currentExample.id,
        currentExample.code,
        html,
        cfg,
        currentExample.fullPage,
      );
      onIframeSrcChange(url);
    },
    [onIframeSrcChange, currentExample],
  );

  return { runPreview };
}

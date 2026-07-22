import { useState, useEffect } from 'react';
import { decodeCode, normalizeApiHost } from '@/lib/playground/utils';
import { DEFAULT_CONFIG } from '@/lib/playground/constants';
import type { Config } from '@/lib/playground/types';
import type { PlaygroundExample } from '@/lib/playground';

export interface PlaygroundState {
  currentExample: PlaygroundExample;
  code: string;
  layout: string;
  config: Config;
  showConfig: boolean;
  iframeSrc: string;
  previewWidth: number | null;
  previewExpanded: boolean;
  editorWidthPct: number;
  isDragging: boolean;
  copied: boolean;
}

export interface PlaygroundStateActions {
  setCurrentExample: (e: PlaygroundExample) => void;
  setCode: (c: string) => void;
  setLayout: (l: string) => void;
  setConfig: (c: Config) => void;
  setShowConfig: (s: boolean) => void;
  setIframeSrc: (s: string) => void;
  setPreviewWidth: (w: number | null) => void;
  setPreviewExpanded: (e: boolean) => void;
  setEditorWidthPct: (p: number) => void;
  setIsDragging: (d: boolean) => void;
  setCopied: (c: boolean) => void;
}

export function usePlaygroundState(
  examples: PlaygroundExample[],
): [PlaygroundState, PlaygroundStateActions] {
  const [currentExample, setCurrentExample] = useState<PlaygroundExample>(examples[0]);
  const [code, setCode] = useState(examples[0].code);
  const [layout, setLayout] = useState(examples[0].layout);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  // Editor hidden by default — revealed via the "Code" toggle in the preview bar.
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [editorWidthPct, setEditorWidthPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize from URL params and localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Resolve example + code from URL
    const rawPreset = params.get('preset');
    const preset = rawPreset ? rawPreset.split('?')[0] : null;
    // Forgive `?preset=foo?debug=true` typos (second `?` instead of `&`) —
    // recover the trailing params into the main set.
    if (rawPreset && rawPreset.includes('?')) {
      const extra = new URLSearchParams(rawPreset.slice(rawPreset.indexOf('?') + 1));
      extra.forEach((v, k) => {
        if (!params.has(k)) params.set(k, v);
      });
    }
    const found = preset ? examples.find((e) => e.id === preset) : null;
    const example = found ?? examples[0];
    const encoded = params.get('code');
    const decoded = encoded ? decodeCode(encoded) : null;
    const initialCode = decoded ?? example.code;

    setCurrentExample(example);
    setCode(initialCode);
    setLayout(example.layout);

    // Resolve config from localStorage + query-string overrides
    try {
      const isDebug = params.get('debug') === 'true';

      // No debug=true → production mode, reset to defaults and clear any stored config.
      // sdkVersion is still honoured from the URL so share links can pin a version.
      if (!isDebug) {
        localStorage.removeItem('next-playground-config');
        const base: Config = { ...DEFAULT_CONFIG };
        if (params.has('sdkVersion')) base.sdkVersion = params.get('sdkVersion')!;
        setConfig(base);
      } else {
        const stored = localStorage.getItem('next-playground-config');
        const base: Config = stored ? JSON.parse(stored) : DEFAULT_CONFIG;

        const qs: Partial<Config> = {};
        if (params.has('sdkVersion')) qs.sdkVersion = params.get('sdkVersion')!;
        if (params.has('debugger')) qs.debugger = params.get('debugger') === 'true';
        // ?debug=true is the gate and also flips the SDK debug flag on
        qs.debug = true;

        // sdkHost only applies in debug mode; opt-in, no auto-default to localhost
        if (params.has('sdkHost')) qs.sdkHost = normalizeApiHost(params.get('sdkHost')!);

        const resolvedConfig = { ...base, ...qs };
        setConfig(resolvedConfig);
        localStorage.setItem('next-playground-config', JSON.stringify(resolvedConfig));

        // Remove config params from URL after applying them
        if (Object.keys(qs).length > 0) {
          const clean = new URL(window.location.href);
          for (const key of ['sdkHost', 'sdkVersion', 'debugger']) {
            clean.searchParams.delete(key);
          }
          window.history.replaceState({}, '', clean.toString());
        }
      }

    } catch {
      // fallback to default
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state: PlaygroundState = {
    currentExample,
    code,
    layout,
    config,
    showConfig,
    iframeSrc,
    previewWidth,
    previewExpanded,
    editorWidthPct,
    isDragging,
    copied,
  };

  const actions: PlaygroundStateActions = {
    setCurrentExample,
    setCode,
    setLayout,
    setConfig,
    setShowConfig,
    setIframeSrc,
    setPreviewWidth,
    setPreviewExpanded,
    setEditorWidthPct,
    setIsDragging,
    setCopied,
  };

  return [state, actions];
}

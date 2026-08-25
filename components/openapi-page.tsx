'use client';

import { createOpenAPIPage } from 'fumadocs-openapi/ui';
import type React from 'react';

const twoColumnLayout = (left: React.ReactNode, right: React.ReactNode) => (
  <div className="flex flex-col gap-x-8 gap-y-4 @2xl:flex-row @2xl:items-start">
    <div className="min-w-0 flex-1">{left}</div>
    <div className="min-w-0 flex-1 @2xl:sticky @2xl:top-[calc(var(--fd-docs-row-1,2rem)+1rem)]">{right}</div>
  </div>
);

export const OpenAPIPage = createOpenAPIPage({
  generateTypeScriptDefinitions: () => undefined,
  content: {
    renderOperationLayout(slots) {
      return twoColumnLayout(
        <>
          {slots.header}
          {slots.apiPlayground}
          {slots.description}
          {slots.authSchemes}
          {slots.parameters}
          {slots.body}
          {slots.responses}
          {slots.callbacks}
        </>,
        <div data-api-requests>{slots.apiExample}</div>,
      );
    },
    renderWebhookLayout(slots) {
      return twoColumnLayout(
        <>
          {slots.header}
          {slots.description}
          {slots.authSchemes}
          {slots.parameters}
          {slots.body}
          {slots.responses}
          {slots.callbacks}
        </>,
        <div data-api-requests>{slots.requests}</div>,
      );
    },
  },
});

import defaultMdxComponents from 'fumadocs-ui/mdx';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { APIPage } from '@/components/api-page';
import { GraphQLOperation } from '@/components/graphql-operation';
import { Mermaid } from '@/components/mdx/mermaid';
import { HttpRequestRow } from '@/components/http-code-block';
import { parseHttpTitle } from '@/components/parse-http-title';
import { CampaignFunnelFlow, CampaignAnatomy } from '@/components/campaign-concepts-flow';
import { CampaignTemplatesGrid } from '@/components/campaign-templates-grid';
import { CodePlayground } from '@/components/CodePlayground';
import type { MDXComponents } from 'mdx/types';
import { Children, isValidElement, type ReactNode } from 'react';

/**
 * Check whether React children contain any visible content.
 * Shiki always emits a <code> with <span class="line"> children — for an
 * empty code fence the line spans contain only whitespace.
 */
function hasContent(children: ReactNode): boolean {
  let found = false;
  Children.forEach(children, (child) => {
    if (found) return;
    if (child == null || child === false) return;
    if (typeof child === 'string') {
      if (child.trim() !== '') found = true;
      return;
    }
    if (isValidElement(child)) {
      const props = child.props as Record<string, unknown>;
      if (props.children != null && hasContent(props.children as ReactNode)) {
        found = true;
      }
      return;
    }
    found = true;
  });
  return found;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    APIPage,
    GraphQLOperation,
    Mermaid,
    CampaignFunnelFlow,
    CampaignAnatomy,
    CampaignTemplatesGrid,
    CodePlayground,
    pre: (props: React.ComponentProps<typeof CodeBlock>) => {
      const title = props.title as string | undefined;
      const http = title ? parseHttpTitle(title) : null;

      if (http) {
        const hasCode = hasContent(props.children);

        // Pass HttpRequestRow as the title to reuse CodeBlock's header layout
        // (icon, border-b, copy button) without duplicating its markup.
        return (
          <CodeBlock
            {...props}
            title={<HttpRequestRow method={http.method} target={http.target} /> as unknown as string}
            icon={undefined}
          >
            {hasCode && <Pre>{props.children}</Pre>}
          </CodeBlock>
        );
      }

      // Default fumadocs rendering
      return (
        <CodeBlock {...props}>
          <Pre>{props.children}</Pre>
        </CodeBlock>
      );
    },
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

// source.config.ts
import { defineDocs, defineConfig, frontmatterSchema } from "fumadocs-mdx/config";
import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins/remark-mdx-mermaid";
import { z } from "zod";
import { visit } from "unist-util-visit";
var LANG_ALIASES = {
  django: "jinja",
  shell: "bash"
};
function remarkDocusaurusCompat() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang === "mdx-code-block") {
        if (index !== void 0 && parent) {
          parent.children.splice(index, 1, {
            type: "mdxjsEsm",
            value: node.value,
            data: { estree: null }
          });
        }
        return;
      }
      if (node.lang) {
        const firstWord = node.lang.split(/\s/)[0];
        if (firstWord.startsWith("title=") || firstWord.startsWith("{")) {
          node.meta = node.lang;
          node.lang = null;
        } else {
          node.meta = node.lang.slice(firstWord.length).trim() || node.meta;
          node.lang = LANG_ALIASES[firstWord] ?? firstWord;
        }
      }
      if (node.meta) {
        const methodMatch = node.meta.match(/http-method="([^"]*)"/);
        const targetMatch = node.meta.match(/http-target="([^"]*)"/);
        if (methodMatch || targetMatch) {
          const method = methodMatch?.[1] ?? "";
          const target = targetMatch?.[1] ?? "";
          node.meta = node.meta.replace(/http-method="[^"]*"/, "").replace(/http-target="[^"]*"/, "").replace(/title="[^"]*"/, "").trim();
          node.meta = `title="__http:${method}:${target}" ${node.meta}`.trim();
        }
      }
    });
  };
}
var docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      title: z.string().optional().default(""),
      full: z.boolean().optional(),
      // Agent-retrieval metadata. `description` (from frontmatterSchema) is required
      // on every authored page by scripts/check-frontmatter.mjs; the fields below are
      // optional.
      audience: z.array(z.enum(["merchant", "developer"])).optional(),
      status: z.enum(["available", "beta", "deprecated"]).optional(),
      last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "last_verified must be YYYY-MM-DD").refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v), {
        message: "last_verified must be a real calendar date"
      }).optional()
    }),
    postprocess: {
      includeProcessedMarkdown: true
    }
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    providerImportSource: "@/components/mdx",
    remarkPlugins: [remarkDocusaurusCompat, remarkMdxMermaid],
    rehypeCodeOptions: {
      themes: { light: "github-light", dark: "github-dark" },
      langs: [
        "python",
        "bash",
        "json",
        "yaml",
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "html",
        "css",
        "sql",
        "graphql"
      ]
    }
  }
});
export {
  source_config_default as default,
  docs
};

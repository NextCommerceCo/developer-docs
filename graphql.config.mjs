/**
 * @graphql-markdown configuration for Storefront GraphQL API docs.
 *
 * Introspects the live schema and generates MDX pages into the fumadocs
 * content directory so they appear under Storefront > GraphQL Reference.
 */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  schema: "https://aptest.29next.store/api/graphql/",
  extensions: {
    ["graphql-markdown"]: {
      rootPath: "./content/docs/storefront/graphql",
      baseURL: ".",
      linkRoot: "/docs/storefront/graphql",
      loaders: {
        UrlLoader: {
          module: "@graphql-tools/url-loader",
          options: { method: "POST" },
        },
      },
      printTypeOptions: {
        typeBadges: true,
      },
      formatter: `${__dirname}/lib/graphql-mdx-formatter.cjs`,
    },
  },
};

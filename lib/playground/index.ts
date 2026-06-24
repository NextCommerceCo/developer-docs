import fs from "node:fs";
import path from "node:path";

export interface PlaygroundExample {
  id: string;
  title: string;
  description: string;
  category: string;
  order: number;
  layout: string;
  code: string;
  /**
   * True for full multi-page sites (e.g. `Olympus MV/upsell-mv`) whose source is
   * a complete HTML document at `<category>/<page>/index.html`. These are served
   * verbatim from `/preview/<slug>/<page>/` rather than wrapped — see
   * buildPreviewUrl in ./utils.
   */
  fullPage?: boolean;
}

const PLAYGROUND_DIR = path.join(process.cwd(), "content/playground");

/**
 * Parse the leading HTML comment block as key: value frontmatter.
 * Supports: title, description, order
 *
 * Example comment:
 *   <!--
 *   title: Package Selector
 *   description: Select a package and add it to the cart.
 *   order: 1
 *   -->
 */
function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  code: string;
} {
  const match = raw.match(/^<!--\s*([\s\S]*?)-->/);
  if (!match) return { meta: {}, code: raw.trim() };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (key) meta[key] = value;
  }

  const code = raw.slice(match[0].length).trim();
  return { meta, code };
}

/**
 * A category folder is a full multi-page site (its pages live in
 * `<page>/index.html` subfolders alongside asset dirs) when its top level holds
 * any subdirectory or any non-`.html` file. A folder of only flat `.html`
 * fragments is a snippet folder. Mirrors isFullSite in scripts/build-preview.mjs.
 */
function isFullSite(catDir: string): boolean {
  return fs
    .readdirSync(catDir, { withFileTypes: true })
    .some((d) => d.isDirectory() || !d.name.endsWith(".html"));
}

/** Top-level subdirs that contain an index.html — the navigable pages of a site. */
function findSitePages(catDir: string): string[] {
  return fs
    .readdirSync(catDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        fs.existsSync(path.join(catDir, d.name, "index.html")),
    )
    .map((d) => d.name)
    .sort();
}

/**
 * Load playground examples under content/playground/<category>/ (skips flows/).
 * Snippet folders contribute one example per flat `.html` fragment; full-site
 * folders contribute one full_page example per `<page>/index.html`.
 */
export function loadPlaygroundExamples(): PlaygroundExample[] {
  const examples: PlaygroundExample[] = [];

  const categories = fs
    .readdirSync(PLAYGROUND_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "flows")
    .map((d) => d.name);

  for (const category of categories) {
    const catDir = path.join(PLAYGROUND_DIR, category);

    if (isFullSite(catDir)) {
      for (const page of findSitePages(catDir)) {
        const raw = fs.readFileSync(
          path.join(catDir, page, "index.html"),
          "utf-8",
        );
        const { meta, code } = parseFrontmatter(raw);

        examples.push({
          id: `${category}/${page}`,
          title: meta.title ?? page.replace(/-/g, " "),
          description: meta.description ?? "",
          category: capitalize(category),
          order: meta.order ? Number(meta.order) : 99,
          layout: meta.layout ?? "full_page",
          code,
          fullPage: true,
        });
      }
      continue;
    }

    const files = fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith(".html"))
      .sort();

    for (const file of files) {
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");
      const { meta, code } = parseFrontmatter(raw);

      // Derive a stable id from the folder + filename
      const id = `${category}/${file.replace(".html", "")}`;

      examples.push({
        id,
        title: meta.title ?? file.replace(".html", "").replace(/-/g, " "),
        description: meta.description ?? "",
        category: capitalize(category),
        order: meta.order ? Number(meta.order) : 99,
        layout: meta.layout ?? "",
        code,
      });
    }
  }

  // Sort by category alphabetically, then by order within each category
  examples.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.order - b.order;
  });

  return examples;
}


function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

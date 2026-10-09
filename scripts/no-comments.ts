import { readFileSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { parseSync } from "oxc-parser";

export type CommentHit = {
  line: number;
  text: string;
};

const checkedExtensions = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);

const vendoredPrefixes = [".claude/"];

const lineAt = (source: string, offset: number): number =>
  source.slice(0, offset).split("\n").length;

const isHashbang = (text: string): boolean => text.startsWith("#!");

export const isChecked = (path: string, root: string = process.cwd()): boolean => {
  const fromRoot = relative(root, resolve(root, path));
  return (
    checkedExtensions.has(extname(path)) &&
    !vendoredPrefixes.some((prefix) => fromRoot.startsWith(prefix))
  );
};

export const findComments = (fileName: string, source: string): CommentHit[] =>
  parseSync(fileName, source)
    .comments.map((comment) => ({
      line: lineAt(source, comment.start),
      text: source.slice(comment.start, comment.end),
    }))
    .filter((hit) => !isHashbang(hit.text));

const run = (paths: string[]): number => {
  const hits = paths
    .filter((path) => isChecked(path))
    .flatMap((path) =>
      findComments(path, readFileSync(path, "utf8")).map(
        (hit) => `${path}:${hit.line} ${hit.text}`,
      ),
    );
  if (hits.length === 0) return 0;
  console.error(hits.join("\n"));
  console.error(
    `\n${hits.length} comment(s) found. Code has no comments; write the explanation in docs/.`,
  );
  return 1;
};

if (import.meta.main) {
  process.exitCode = run(process.argv.slice(2));
}

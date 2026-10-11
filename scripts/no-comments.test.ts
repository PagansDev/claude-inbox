import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findComments, isChecked } from "./no-comments.ts";

describe("isChecked", () => {
  const root = "/repo";

  it("checks script files by extension", () => {
    assert.equal(isChecked("src/app.ts", root), true);
    assert.equal(isChecked("src/view.tsx", root), true);
    assert.equal(isChecked("tools/run.mjs", root), true);
  });

  it("checks Rust files", () => {
    assert.equal(isChecked("src-tauri/src/lib.rs", root), true);
  });

  it("skips files that are not scripts", () => {
    assert.equal(isChecked("README.md", root), false);
    assert.equal(isChecked("biome.json", root), false);
  });

  it("skips vendored files given as relative paths", () => {
    assert.equal(isChecked(".claude/skills/x/review.js", root), false);
  });

  it("skips vendored files given as absolute paths", () => {
    assert.equal(isChecked("/repo/.claude/skills/x/review.js", root), false);
    assert.equal(isChecked("/repo/src/app.ts", root), true);
  });
});

describe("findComments", () => {
  it("returns nothing for a file without comments", () => {
    assert.deepEqual(findComments("a.ts", "export const a = 1\n"), []);
  });

  it("reports a line comment with its line number", () => {
    assert.deepEqual(findComments("a.ts", "const a = 1\nconst b = 2 // note\n"), [
      { line: 2, text: "// note" },
    ]);
  });

  it("reports block and doc comments", () => {
    const source = "/* block */\nconst a = 1\n/** doc */\nexport const b = a\n";
    assert.deepEqual(findComments("a.ts", source), [
      { line: 1, text: "/* block */" },
      { line: 3, text: "/** doc */" },
    ]);
  });

  it("reports a comment at the end of the file", () => {
    assert.deepEqual(findComments("a.ts", "export const a = 1\n// tail"), [
      { line: 2, text: "// tail" },
    ]);
  });

  it("ignores comment markers inside strings, templates and regular expressions", () => {
    const source = [
      "const url = 'https://example.com'",
      "const tpl = `/* not a comment */`",
      "const re = /\\/\\//g",
      "export const all = { url, tpl, re }",
      "",
    ].join("\n");
    assert.deepEqual(findComments("a.ts", source), []);
  });

  it("ignores the hashbang line", () => {
    assert.deepEqual(findComments("a.mjs", "#!/usr/bin/env node\nexport const a = 1\n"), []);
  });

  it("parses JSX and TSX files", () => {
    const source = "export const A = () => <div>{/* hidden */}</div>\n";
    assert.deepEqual(findComments("a.tsx", source), [{ line: 1, text: "/* hidden */" }]);
  });
});

describe("findComments in Rust", () => {
  it("returns nothing for a file without comments", () => {
    assert.deepEqual(findComments("a.rs", "fn main() {}\n"), []);
  });

  it("reports line and block comments", () => {
    const source = "fn main() {\n    let a = 1; // note\n    /* block */\n}\n";
    assert.deepEqual(findComments("a.rs", source), [
      { line: 2, text: "// note" },
      { line: 3, text: "/* block */" },
    ]);
  });

  it("reports outer and inner doc comments", () => {
    const source = "//! crate doc\n/// item doc\n/** block doc */\npub fn run() {}\n";
    assert.deepEqual(findComments("a.rs", source), [
      { line: 1, text: "//! crate doc" },
      { line: 2, text: "/// item doc" },
      { line: 3, text: "/** block doc */" },
    ]);
  });

  it("ignores comment markers inside strings, raw strings and chars", () => {
    const source = [
      "fn main() {",
      '    let url = "https://example.com";',
      '    let raw = r#"// not a comment"#;',
      "    let slash = '/';",
      "    let _ = (url, raw, slash);",
      "}",
      "",
    ].join("\n");
    assert.deepEqual(findComments("a.rs", source), []);
  });

  it("ignores attributes", () => {
    const source = [
      '#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]',
      "#[tauri::command]",
      "fn greet() {}",
      "",
    ].join("\n");
    assert.deepEqual(findComments("a.rs", source), []);
  });
});

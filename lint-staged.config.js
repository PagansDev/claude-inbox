const cargo = "cargo --quiet";
const manifest = "--manifest-path src-tauri/Cargo.toml";

export default {
  "*": [
    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
    "node scripts/no-comments.ts",
  ],
  "*.rs": () => [
    `${cargo} fmt ${manifest} --check`,
    `${cargo} clippy ${manifest} --all-targets -- -D warnings`,
  ],
};

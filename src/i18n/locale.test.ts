import { describe, expect, it } from "vitest";
import { resolveLocale } from "./locale";

describe("resolveLocale", () => {
  it.each([
    [["pt-BR"], "pt-BR"],
    [["PT-br"], "pt-BR"],
    [["pt"], "pt-BR"],
    [["pt-PT"], "pt-BR"],
    [["es-MX"], "es"],
    [["en-GB"], "en"],
    [["fr-FR", "es"], "es"],
    [["fr"], "en"],
    [[], "en"],
  ])("resolves %j to %s", (preferred, expected) => {
    expect(resolveLocale(preferred)).toBe(expected);
  });
});

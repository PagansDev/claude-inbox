import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { I18nProvider, useMessages } from "./i18n/I18nProvider";
import type { Locale } from "./i18n/locale";

const renderIn = (locale: Locale) =>
  render(
    <I18nProvider locale={locale}>
      <App />
    </I18nProvider>,
  );

describe("App", () => {
  it.each([
    ["en", "No pending questions."],
    ["pt-BR", "Nenhuma pergunta pendente."],
    ["es", "No hay preguntas pendientes."],
  ] as const)("renders the %s catalogue", (locale, emptyInbox) => {
    renderIn(locale);
    expect(screen.getByRole("heading", { level: 1, name: "claude-inbox" })).toHaveAttribute(
      "translate",
      "no",
    );
    expect(screen.getByText(emptyInbox)).toBeInTheDocument();
  });
});

describe("useMessages", () => {
  it("throws outside I18nProvider", () => {
    const silence = vi.spyOn(console, "error").mockImplementation(() => {});
    const Probe = () => <p>{useMessages().appName}</p>;
    expect(() => render(<Probe />)).toThrow("useMessages must be used inside I18nProvider");
    silence.mockRestore();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("shows the app name as the page heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "claude-inbox" })).toBeInTheDocument();
  });

  it("shows the empty inbox message", () => {
    render(<App />);
    expect(screen.getByText("No pending questions.")).toBeInTheDocument();
  });
});

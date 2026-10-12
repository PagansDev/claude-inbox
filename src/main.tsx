import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { I18nProvider } from "./i18n/I18nProvider";
import { resolveLocale } from "./i18n/locale";
import "./index.css";

const locale = resolveLocale(navigator.languages);
document.documentElement.lang = locale;

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <I18nProvider locale={locale}>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
}

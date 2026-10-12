import { en, type Messages } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";

export const catalogues = { en, "pt-BR": ptBR, es } satisfies Record<string, Messages>;

export type Locale = keyof typeof catalogues;

export const fallbackLocale: Locale = "en";

const locales = Object.keys(catalogues) as Locale[];

const baseOf = (tag: string): string => tag.toLowerCase().split("-")[0] ?? "";

const match = (tag: string): Locale | undefined =>
  locales.find((locale) => locale.toLowerCase() === tag.toLowerCase()) ??
  locales.find((locale) => baseOf(locale) === baseOf(tag));

export const resolveLocale = (preferred: readonly string[]): Locale =>
  preferred.map(match).find((locale) => locale !== undefined) ?? fallbackLocale;

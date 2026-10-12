# Spec 05 — i18n skeleton

## Requirement
When the app starts, given the system's preferred languages (`navigator.languages`, in order), the app must pick the first supported locale and render every on-screen string from that locale's catalogue. Supported locales are `en`, `pt-BR` and `es`; when none matches, it uses `en`. It must also set `<html lang>` to the chosen locale.

## Locale resolution — `resolveLocale(preferred: readonly string[]): Locale`

Matching is case-insensitive. For each preferred tag in order:
1. If it equals a supported locale, use that locale.
2. Otherwise, if its base language (the part before `-`) is the base of a supported locale, use that locale.
3. Otherwise, try the next tag.

If no tag matches, use `en`.

| Input | Result | Why |
|-------|--------|-----|
| `["pt-BR"]` | `pt-BR` | exact |
| `["PT-br"]` | `pt-BR` | case-insensitive |
| `["pt"]` | `pt-BR` | base language |
| `["pt-PT"]` | `pt-BR` | the only Portuguese catalogue |
| `["es-MX"]` | `es` | base language |
| `["en-GB"]` | `en` | base language |
| `["fr-FR", "es"]` | `es` | first supported in preference order |
| `["fr"]` | `en` | fallback |
| `[]` | `en` | fallback |

## Catalogues

| Key | en | pt-BR | es |
|-----|----|-------|----|
| `appName` | claude-inbox | claude-inbox | claude-inbox |
| `emptyInbox` | No pending questions. | Nenhuma pergunta pendente. | No hay preguntas pendientes. |

- `en.ts` is the source. Its keys define the `Messages` type.
- `pt-BR.ts` and `es.ts` are declared as `Messages`. A missing key or an extra key is a compile error.
- `appName` is the product name and is not translated. It still lives in the catalogue, so no string on screen is hard-coded.

## React surface
- `I18nProvider` takes a `locale` and provides that locale's messages.
- `useMessages()` returns the active messages. Calling it outside a provider is a programming error and throws.
- `main.tsx` resolves the locale from `navigator.languages`, sets `document.documentElement.lang`, and renders `App` inside `I18nProvider`.

## Success cases
- **S1:** `App` inside `I18nProvider locale="pt-BR"` shows the heading `claude-inbox` and `Nenhuma pergunta pendente.`.
- **S2:** with `es`, it shows `No hay preguntas pendientes.`.
- **S3:** with `en`, it shows `No pending questions.`.
- **S4:** on this machine (pt-BR system), `npm run tauri dev` shows the Portuguese text, and `<html lang>` is `pt-BR`.

## Failure cases
- **F1:** a key deleted from `pt-BR.ts` makes `npm run typecheck` fail, naming the missing property.
- **F2:** a key added to `es.ts` but not to `en.ts` makes `npm run typecheck` fail on the unknown property.
- **F3:** `useMessages()` outside `I18nProvider` throws `useMessages must be used inside I18nProvider`.

## Contracts involved
- `Locale = "en" | "pt-BR" | "es"`.
- `Messages = { [K in keyof typeof en]: string }`.

## Expected states
- `locale resolved`
- `text rendered`

## Out of scope
- Plurals and interpolation (added with the first string that needs them, using `Intl.PluralRules`).
- The settings override.
- Switching language while the app is running.

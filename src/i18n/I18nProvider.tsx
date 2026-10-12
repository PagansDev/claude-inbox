import { createContext, type ReactNode, useContext } from "react";
import type { Messages } from "./en";
import { catalogues, type Locale } from "./locale";

const MessagesContext = createContext<Messages | null>(null);

type I18nProviderProps = {
  locale: Locale;
  children: ReactNode;
};

export const I18nProvider = ({ locale, children }: I18nProviderProps) => (
  <MessagesContext value={catalogues[locale]}>{children}</MessagesContext>
);

export const useMessages = (): Messages => {
  const messages = useContext(MessagesContext);
  if (!messages) throw new Error("useMessages must be used inside I18nProvider");
  return messages;
};

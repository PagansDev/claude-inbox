import { Inbox } from "lucide-react";
import { useMessages } from "./i18n/I18nProvider";

export const App = () => {
  const messages = useMessages();
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 p-8 font-sans">
      <Inbox aria-hidden="true" className="size-12 text-accent" strokeWidth={1.5} />
      <h1 className="font-mono text-2xl font-semibold tracking-tight" translate="no">
        {messages.appName}
      </h1>
      <p className="text-sm text-muted">{messages.emptyInbox}</p>
    </main>
  );
};

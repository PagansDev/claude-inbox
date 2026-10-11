import { Inbox } from "lucide-react";

export const App = () => (
  <main className="flex h-full flex-col items-center justify-center gap-4 p-8 font-sans">
    <Inbox aria-hidden="true" className="size-12 text-accent" strokeWidth={1.5} />
    <h1 className="font-mono text-2xl font-semibold tracking-tight">claude-inbox</h1>
    <p className="text-sm text-muted">No pending questions.</p>
  </main>
);

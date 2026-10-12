export const en = {
  appName: "claude-inbox",
  emptyInbox: "No pending questions.",
};

export type Messages = { [Key in keyof typeof en]: string };

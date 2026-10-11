import { randomBytes, timingSafeEqual } from "node:crypto";
import { appendFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

type Option = { label: string; description?: string };

type Question = {
  question: string;
  header?: string;
  options: Option[];
  multiSelect?: boolean;
};

type HookInput = {
  session_id?: string;
  cwd?: string;
  tool_name?: string;
  tool_input?: { questions?: Question[] };
};

const host = "127.0.0.1";
const port = Number(process.env.SPIKE_PORT ?? 7777);
if (process.env.SPIKE_TOKEN === "") {
  console.error("SPIKE_TOKEN is set but empty. Export the token from the test settings first.");
  process.exit(1);
}

const token = process.env.SPIKE_TOKEN ?? randomBytes(32).toString("hex");
const mode = process.env.SPIKE_MODE === "freetext" ? "freetext" : "first";
const delayMs = Number(process.env.SPIKE_DELAY_MS ?? 0);
const tokenHeader = "x-claude-inbox-token";
const freeText = "SPIKE-FREE-TEXT";
const logFile = new URL("./payloads.jsonl", import.meta.url);

const isAuthorized = (header: string | string[] | undefined): boolean => {
  if (typeof header !== "string") return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

const answerFor = (question: Question): string => {
  if (mode === "freetext") return freeText;
  const labels = question.options.map((option) => option.label);
  return question.multiSelect ? labels.slice(0, 2).join(", ") : (labels[0] ?? freeText);
};

const buildResponse = (questions: Question[]) => ({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    updatedInput: {
      questions,
      answers: Object.fromEntries(
        questions.map((question) => [question.question, answerFor(question)]),
      ),
    },
  },
});

const readBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const record = (request: IncomingMessage, body: string): void => {
  const headers = Object.fromEntries(
    Object.entries(request.headers).filter(([name]) => name !== tokenHeader),
  );
  const entry = {
    at: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers,
    body: parseJson(body) ?? body,
  };
  appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
};

const reply = (response: ServerResponse, status: number, body?: unknown): void => {
  if (body === undefined) {
    response.writeHead(status).end();
    return;
  }
  response.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
};

const handle = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  const body = await readBody(request);
  record(request, body);

  if (!isAuthorized(request.headers[tokenHeader])) {
    console.log(`401 ${request.method} ${request.url}`);
    reply(response, 401);
    return;
  }

  const input = parseJson(body) as HookInput | undefined;
  const questions = input?.tool_input?.questions;
  const isQuestion =
    request.method === "POST" &&
    request.url === "/hooks/pre-tool-use" &&
    input?.tool_name === "AskUserQuestion" &&
    Array.isArray(questions);

  if (!isQuestion || !questions) {
    console.log(`pass-through ${request.method} ${request.url} ${input?.tool_name ?? ""}`);
    reply(response, 200);
    return;
  }

  const session = input.session_id?.slice(0, 8) ?? "unknown";
  let closed = false;
  response.on("close", () => {
    if (response.writableFinished) return;
    closed = true;
    console.log(`client closed before answer (session ${session})`);
  });

  console.log(`holding ${questions.length} question(s) from session ${session} for ${delayMs} ms`);
  await sleep(delayMs);
  if (closed) return;

  const output = buildResponse(questions);
  console.log(`answered session ${session}:`, output.hookSpecificOutput.updatedInput.answers);
  reply(response, 200, output);
};

const settings = {
  hooks: {
    PreToolUse: [
      {
        matcher: "AskUserQuestion",
        hooks: [
          {
            type: "http",
            url: `http://${host}:${port}/hooks/pre-tool-use`,
            timeout: 3600,
            headers: { "X-Claude-Inbox-Token": token },
          },
        ],
      },
    ],
  },
};

createServer((request, response) => {
  handle(request, response).catch((error: unknown) => {
    console.error("handler failed:", error);
    if (!response.headersSent) reply(response, 500);
  });
}).listen(port, host, () => {
  console.log(`spike listening on http://${host}:${port} (mode ${mode}, delay ${delayMs} ms)`);
  console.log("\n.claude/settings.local.json for the test directory:\n");
  console.log(JSON.stringify(settings, null, 2));
  console.log("");
});

import * as readline from "readline";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";

console.info(
  `Thread started using API key ending in "${process.env.ANTHROPIC_API_KEY?.slice(
    -5
  )}".\n`
);

const state = { sessionId: null as string | null };

async function* readStdinLines(): AsyncGenerator<string> {
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    yield line;
  }
}

async function* generateMessages(): AsyncGenerator<SDKUserMessage> {
  for await (const line of readStdinLines()) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "exit" || trimmed === "/quit") break;
    yield {
      type: "user",
      message: { role: "user" as const, content: trimmed },
      parent_tool_use_id: null,
      session_id: state.sessionId ?? "",
    };
  }
}

const SYSTEM_PROMPT = await Bun.file('./SYSTEM_PROMPT.md').text();

const q = query({
  prompt: generateMessages(),
  options: {
    maxTurns: 20,
    includePartialMessages: true,
    allowedTools: ["Read", "Grep"],
    model: "claude-haiku-4-5-20251001",
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: SYSTEM_PROMPT,
    }
  },
});

try {
  for await (const message of q) {
    if ("session_id" in message && message.session_id) {
      state.sessionId = message.session_id;
    }

    if (message.type === "stream_event") {
      const event = message.event;
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          process.stdout.write(event.delta.text);
        }
      }
    }

    if (message.type === "assistant") {
      process.stdout.write("\n");
    }
  }
} finally {
  process.stdout.write("\nEnd of thread!\n");

  q.close();
  process.exit();
}

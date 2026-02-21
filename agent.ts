import * as readline from "readline";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage, SDKMessage, SDKAssistantMessage, SDKPartialAssistantMessage } from "@anthropic-ai/claude-agent-sdk";

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
  yield {
    type: "user",
    message: { 
      role: "user" as const, 
      content: 'Tell me about yourself! What are you and what can you help me with?', 
    },
    parent_tool_use_id: null,
    session_id: state.sessionId ?? "",
  }

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
    model: "claude-haiku-4-5-20251001",
    settingSources: ["project"],
    systemPrompt: SYSTEM_PROMPT,
    mcpServers: {
      "claude-code-docs": {
        type: "http",
        url: "https://code.claude.com/docs/mcp"
      }
    },
    allowedTools: [
      "Read", 
      "Grep", 
      "Skill", 
      "mcp__claude-code-docs__*",
      "web_fetch_20260209",
    ],
  },
});

const trace = [];

try {
  let current_message = '';

  for await (const message of q as AsyncGenerator<SDKPartialAssistantMessage>) {
    if ("session_id" in message && message.session_id) {
      state.sessionId = message.session_id;
    }

    if (message.type === "stream_event") {
      const event = message.event;

      if (event.type === 'message_start') {
        current_message = '';
      }

      if (event.type === 'message_stop') {
        trace.push(current_message);
      }

      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          current_message += event.delta.text;
          process.stdout.write(event.delta.text);
        }
      }
    } else {
      process.stdout.write('\n');
      trace.push(message);
    }
  }
} finally {
  process.stdout.write("\nEnd of thread!\n");

  Bun.file('./trace.json').write(JSON.stringify(trace, null, '  '));

  q.close();
  process.exit();
}

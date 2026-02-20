/**
 * Multi-turn CLI agent — executable teaching example
 * ===================================================
 *
 * This script runs a REPL-style conversation with Claude: you type a line on
 * stdin, the agent replies (streamed to stdout), and the loop continues until
 * you type "exit" or "/quit" or close stdin (e.g. Ctrl+D).
 *
 * Key idea: the SDK's query() accepts a *prompt* that is either a string or an
 * AsyncIterable<SDKUserMessage>. When you pass an async generator, the SDK
 * *pulls* the next user message from it after each assistant turn. So we use a
 * generator that blocks on reading the next line from stdin and yields it as a
 * user message — that gives us multi-turn input from the command line.
 */

import * as readline from "readline";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";


// Make sure you have a .env file with ANTHROPIC_API_KEY=your-key-here !
console.info(`Thread started using API key ending in "${process.env.ANTHROPIC_API_KEY?.slice(-5)}".\n`);

// -----------------------------------------------------------------------------
// Shared session state (must be mutable and shared between generator and loop)
// -----------------------------------------------------------------------------
// The SDK expects each user message to include a session_id. We don't get that
// until the backend sends its first message (e.g. system/init or assistant).
// So: the main loop captures session_id from any message that has it; the
// prompt generator reads state.sessionId when yielding. First message uses "".
const state = { sessionId: null as string | null };

// -----------------------------------------------------------------------------
// Stdin line reader — async iterable of lines
// -----------------------------------------------------------------------------
// We need to read stdin line-by-line. Node/Bun readline makes stdin
// async-iterable (for await...of), so we wrap it in a generator that yields
// each line. When the user closes stdin (Ctrl+D), the iterator ends and our
// prompt generator will stop yielding, so the conversation ends cleanly.
async function* readStdinLines(): AsyncGenerator<string> {
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    yield line;
  }
}

// -----------------------------------------------------------------------------
// Prompt generator — turns stdin lines into SDK user messages
// -----------------------------------------------------------------------------
// This is the "prompt" we pass to query() below. The SDK will:
//   1. Call .next() to get the first user message (we block on first stdin line).
//   2. Run the model, stream events to our for-await loop.
//   3. When the turn is done, call .next() again for the next user message.
//   4. We block on the next stdin line, then yield it — repeat.
// So the generator ties "next line from stdin" to "next user message in the
// conversation". We skip empty lines and treat "exit"/"/quit" as end-of-chat.
async function* generateMessages(): AsyncGenerator<SDKUserMessage> {
  for await (const line of readStdinLines()) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "exit" || trimmed === "/quit") break;
    yield {
      type: "user",
      message: { role: "user" as const, content: trimmed },
      parent_tool_use_id: null, // top-level user message, not a tool follow-up
      session_id: state.sessionId ?? "", // filled in by main loop after first message
    };
  }
}

// -----------------------------------------------------------------------------
// Start the query (single long-lived session)
// -----------------------------------------------------------------------------
// query() returns an AsyncGenerator of SDKMessage plus methods like .close().
// We keep a reference so we can call q.close() in finally for cleanup.
// - prompt: our async generator; the SDK consumes it one message per turn.
// - maxTurns: how many back-and-forth turns before the SDK stops (we set high
//   so the REPL can run for many exchanges).
// - includePartialMessages: we get stream_event with content_block_delta so we
//   can print tokens as they arrive.
// - allowedTools: which tools the agent may use (e.g. Read, Grep).
const q = query({
  prompt: generateMessages(),
  options: {
    maxTurns: 20, // Lower for teaching; use 500+ for a long-lived REPL
    includePartialMessages: true,
    allowedTools: ["Read", "Grep"],
    model: "claude-haiku-4-5-20251001", // Optional: pin a specific model
  },
});

// -----------------------------------------------------------------------------
// Consume the stream and drive the session
// -----------------------------------------------------------------------------
// We iterate over every message the SDK emits. Types include: system (init,
// status), stream_event (deltas while the model is speaking), assistant (full
// message when the turn is done), user (replay), result, etc. We do three
// things: (1) capture session_id so the prompt generator can attach it to
// subsequent user messages; (2) forward text deltas to stdout for streaming
// output; (3) print a newline after each assistant turn for readability.
try {
  for await (const message of q) {
    // Any message may carry session_id; we need it for the next user message.
    if ("session_id" in message && message.session_id) {
      state.sessionId = message.session_id;
    }
    // Stream token deltas to stdout so the user sees the reply as it’s generated.
    if (message.type === "stream_event") {
      const event = message.event;
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          process.stdout.write(event.delta.text);
        }
      }
    }
    // When the assistant turn is complete, end the line for readability.
    if (message.type === "assistant") {
      process.stdout.write("\n");
    }
  }
} finally {
  process.stdout.write("\nEnd of thread!\n");
  // Always close the query so the SDK’s CLI subprocess and resources are
  // terminated (avoids hanging processes on exit or error).
  q.close();
  process.exit();
}

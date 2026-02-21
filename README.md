# Erik's Claude Agent SDK Demo

This repo is a living, teaching example for a minimalist agent implemented with the Claude Agent SDK. Run it and talk to it, learn something about building agents!

## Prerequisites

- [Bun](https://bun.com/) installed
- `ANTHROPIC_API_KEY` set in your environment or via `.env` file in the project folder

## Quick start

To run the agent in the CLI:

```bash
$ bun install
$ bun start
```

To exit the CLI agent:

```bash
> /quit

OR

> exit
```

## Teaching examples

- [agent.ts](./agent.ts) — This is the code that governs the actual agent thread! It's where you and the model talk to each other!
- [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md) — This is the system prompt we use to override the default system prompt that already comes with the Claude SDK!
- [.claude/skills/agent-skills-teacher](.claude/skills/agent-skills-teacher/SKILL.md) — This is an agent skill for teaching you about agent skills!
- [Claude Code Docs MCP](https://code.claude.com/docs/mcp) — This public MCP server is used to demonstrate how a remote-hosted MCP server exposed via HTTPS would be connected to the agent (configured in [agent.ts](./agent.ts)). It also makes this agent an expert on how to use Claude and the Claude Agent SDK!
- [trace.json](./trace.json) — After you've run the agent, the trace for your last thread is written here when the thread ends (after you type `/quit` or `exit`). This shows what happens inside the agent thread that you normally don't see as an end-user!

## Further reading

- [Claude Agent SDK - Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Understanding System Prompts](https://platform.claude.com/docs/en/agent-sdk/modifying-system-prompts#understanding-system-prompts)
- [What are skills?](https://agentskills.io/what-are-skills)

## Technical Notes

- This project is package-managed and executed using [Bun](https://bun.com/)


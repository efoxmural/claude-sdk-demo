# Erik's Claude Agent SDK Demo

This repo is a living, teaching example for a minimalist agent implemented with the Claude Agent SDK.

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

- `[agent.ts](./agent.ts)` — This is the code that governs the actual agent thread! It's where you and the model talk to each other!
- `[SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md)` — This is the system prompt we use to extend the baseline system prompt that already comes with the Claude SDK!
- `[.claude/skills/agent-skills-teacher](.claude/skills/agent-skills-teacher/SKILL.md)` — This is an agent skill for teach you about agent skills!
- `[https://code.claude.com/docs/mcp](./agent.ts)` — This public MCP server is used to demonstrate how a remote-hosted MCP server exposed via HTTPS would be connect to the agent. It also makes this agent an expert on how to use Claude and the Claude Agent SDK!

## Further reading

- [Claude Agent SDK - Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Understanding System Prompts](https://platform.claude.com/docs/en/agent-sdk/modifying-system-prompts#understanding-system-prompts)
- [What are skills?](https://agentskills.io/what-are-skills)

## Technical Notes

- This project is package-managed and executed using [Bun](https://bun.com/)


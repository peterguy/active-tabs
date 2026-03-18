# Active Tabs - Project Guidelines

## Project Overview
A local web app for managing, organizing, and intelligently summarizing browser links/tabs.

## Commands
```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm check        # Run type checking
pnpm lint         # Run linter
pnpm test         # Run tests

# Database
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

## Tech Stack
- **Framework**: SvelteKit (local-first web app)
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **Styling**: Tailwind CSS
- **LLM**: Ollama (local inference for summaries)
- **Package Manager**: pnpm

## Code Conventions
- Use TypeScript for all code
- Prefer `const` over `let`
- Use descriptive variable names
- Keep components small and focused
- Store secrets/tokens encrypted in SQLite

## Agent Instructions
- **ALWAYS use `bd` for project tracking** - plans, decisions, progress updates, task breakdowns, and any documentation/planning artifacts should be stored using the `bd` CLI tool, not in markdown files or inline
- Run `pnpm check` after making TypeScript changes
- Run `pnpm lint` after making any code changes
- Test OAuth integrations manually with real tokens

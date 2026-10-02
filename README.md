# Project Frontend Template

This repo is a **template/reference structure** for a Next.js frontend that consumes the
[project backend](../memoirproject-ai-backend). It is not a working product — the folders and files
here show you *how* to organize your code and *what kind of content* belongs in each layer. The one
feature included (`example`) is a placeholder that calls the backend's placeholder endpoint.

It is deliberately shaped to mirror the backend template, so a developer who has worked in one repo
can guess where things go in the other.

## Table of contents

- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [The two data paths](#the-two-data-paths)
- [Validation](#validation)
- [Error handling](#error-handling)
- [How to add a feature](#how-to-add-a-feature)
- [Conventions](#conventions)
- [Setup](#setup)
- [Scripts](#scripts)
- [Notes](#notes)

Every directory under `src/` also has its own `README.md` explaining what belongs in it. If you are
exploring the tree, read those — they are written for the moment you are standing in the folder.

**New to the repo?** Start with [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — the guided tour, in reading
order, with the rules and the recipe for adding a feature.

## Architecture

The backend's layering has a direct equivalent here:

| Backend | Frontend | Job |
| --- | --- | --- |
| `src/api/` | `src/app/` | Entry points. Thin. Compose and delegate immediately. |
| `src/domain/<feature>/` | `src/features/<feature>/` | Everything about one feature, in one folder. |
| `src/models/example_models.py` | `features/<feature>/schemas.ts` | The contract. Zod is the twin of Pydantic. |
| `src/integrations/llm_client.py` | `src/lib/api/client.ts` | The only code that talks to the outside world. |
| `src/core/` | `src/lib/config/`, `src/app/providers.tsx` | App-wide setup: env validation, providers. |
| `src/utils/` | `src/utils/` | Generic helpers, not tied to a feature. Pure functions, no dependencies. |
| — | `src/hooks/` | Shared React hooks. No domain knowledge, no fetching. |

Requests flow the same direction they do on the backend:

```
app/  ->  features/<feature>/  ->  lib/api/
(routes)   (feature logic)         (HTTP: base URL, errors, validation)
```

## Folder structure

Every directory has a `README.md` describing what belongs in it.

```
src/
  app/
    README.md
    layout.tsx                  # Root layout (server component)
    providers.tsx               # The single client boundary: QueryClientProvider
    error.tsx                   # Route-level error boundary
    page.tsx                    # Landing page
    example/page.tsx            # Example route — thin, composes the feature
  features/
    README.md                   # What a feature folder holds, and the rules
    example/
      README.md                 # Read this one first
      schemas.ts                # Zod contract — twin of example_models.py
      api.ts                    # The only place the endpoint path is written
      queries.ts                # SERVER data path
      hooks.ts                  # CLIENT data path (TanStack Query)
      index.ts                  # Public surface (client-safe)
      server.ts                 # Public surface (server-only)
      components/
        GreetingCard.tsx        # Display only — works on server or client
        GreetingForm.tsx        # Interactive — "use client", React Hook Form
  components/
    README.md
    ui/                         # shadcn primitives. No domain knowledge.
  lib/
    README.md
    api/client.ts               # fetch wrapper: base URL, timeout, errors, validation
    api/errors.ts               # ApiError taxonomy
    config/env.ts               # Zod-validated environment, fails fast at boot
    query/client.ts             # TanStack Query defaults
    utils.ts                    # shadcn's `cn` helper (managed by the shadcn CLI)
  hooks/
    README.md                   # Shared React hooks. Empty until a second feature needs one.
  utils/
    README.md                   # Pure generic helpers. Empty until a second caller needs one.
```

## The two data paths

The example feature calls **one** backend endpoint **two** ways, because real features need both.

```
server path:  app/example/page.tsx  ->  queries.ts  ->  api.ts  ->  lib/api/client.ts  ->  backend
client path:  GreetingForm.tsx      ->  hooks.ts    ->  api.ts  ->  lib/api/client.ts  ->  backend
```

Both converge on `api.ts` and the same Zod schemas, so an endpoint and its contract are each
written exactly once.

> **The rule: default to the server path. Use the client path only when the data changes in
> response to the user** — mutations, polling, user-triggered refetch, optimistic updates.

Server-path data arrives as HTML with no loading spinner and no client round trip. Client-path data
gets caching, retries, and `isPending` / `isError` states from TanStack Query.

### Why the feature has two barrel files

`queries.ts` imports `server-only`, which makes the build fail if server code reaches the browser.
A single barrel re-exporting both paths would poison every client component that imported it — even
one that only wanted a type. So:

- `import { ... } from "@/features/example"` — anywhere
- `import { ... } from "@/features/example/server"` — server components only

## Validation

One Zod schema per shape, doing three jobs. `greetingRequestSchema` is written once in
`features/example/schemas.ts` and then:

| Where | How | What it buys |
| --- | --- | --- |
| The form | `zodResolver` in `GreetingForm.tsx` | Per-field error messages before any request is sent |
| The request | `schema.parse(request)` in `api.ts` | A bad body never reaches the backend |
| The types | `z.input` / `z.output` | `GreetingRequest` and `GreetingFormValues`, never hand-written |

Change a rule — say, a maximum name length — and all three follow. The field error text in the UI
comes from the schema, not from the component, so there is no second place to update.

Responses are validated too, by `apiRequest` in `lib/api/client.ts`. Nothing enters the app
unvalidated in either direction.

> `z.input` is what a caller may pass (fields with defaults are optional); `z.output` is what exists
> after parsing. React Hook Form needs both — see the three generics on `useForm`.

## Error handling

`lib/api/client.ts` normalizes every failure into an `ApiError` with one of three codes. Components
never see a raw `TypeError`, `Response`, or `ZodError`.

| Code | Meaning | What to do |
| --- | --- | --- |
| `network` | No answer — backend down, DNS, or timeout | Retry; show "can't reach the server" |
| `http` | Non-2xx. FastAPI's `detail` is unwrapped into the message | Show it; a 4xx means the request was wrong |
| `contract` | 200, but the body failed the Zod schema | **Fix the code.** Frontend and backend have drifted |

`contract` is the valuable one. Without it, a renamed backend field shows up as `undefined` three
components deep. With it, you get a message naming the offending field at the moment it arrives.

Failures surface through `app/error.tsx` (server path) and `isError` (client path).

## How to add a feature

Same shape as adding a feature to the backend:

1. `src/features/<name>/schemas.ts` — the Zod twin of the backend's Pydantic models.
2. `src/features/<name>/api.ts` — one function per endpoint, calling `apiRequest`.
3. `src/features/<name>/queries.ts` **or** `hooks.ts` — pick a data path (see the rule above).
4. `src/features/<name>/index.ts` — export the feature's public surface. Add `server.ts` if you
   wrote `queries.ts`.
5. `src/app/<name>/page.tsx` — a thin route that composes it.

Copy `features/example/` and delete what you don't need.

## Conventions

These are what keep the template from rotting:

1. **`app/` stays thin.** Pages import from a feature and compose it. No `fetch`, no business logic.
2. **A feature is a folder.** Deleting `features/<name>/` deletes the feature completely.
3. **Only `lib/api/client.ts` calls `fetch`.** Features describe *what*; the client owns *how*.
4. **Cross-feature imports go through `index.ts` / `server.ts`.** Never deep-import another
   feature's internals.
5. **`components/ui/` knows nothing about your domain.** If a component knows what a greeting is,
   it belongs to the feature.

## Setup

The backend must be running first:

```bash
cd ../memoirproject-ai-backend
uvicorn src.main:app --reload      # http://localhost:8000
```

Then:

```bash
npm install
cp .env.example .env.local         # points at http://localhost:8000
npm run dev                        # http://localhost:3000
```

Visit `/example` to see both data paths against the live backend. The React Query Devtools button
sits in the bottom-right corner in development — open it while reading `features/example/hooks.ts`
to watch the cache populate and invalidate.

VS Code users: accept the recommended extensions prompt (`.vscode/extensions.json`) for Tailwind
IntelliSense, inline ESLint, and readable TypeScript errors.

Environment variables are validated by `src/lib/config/env.ts` at startup — a missing or malformed
value fails immediately with a readable message rather than as a mystery 404 later.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run verify` | typecheck + lint |

## Notes

- **No authentication layer.** The backend has none today (CORS is open, no middleware). When it
  grows one, the token belongs in `lib/api/client.ts` — the single place requests are built — and
  nowhere else.
- **Next.js 16.** `params` and `searchParams` are async, `middleware` is now `proxy`, and Turbopack
  is the default bundler. Cache Components (`use cache`) are **not** enabled, so the classic
  `cache` / `next: { revalidate, tags }` options apply. See `node_modules/next/dist/docs/`.
- **`unstable_rethrow` in the API client is deliberate.** Next.js signals control flow by throwing
  (`notFound()`, `redirect()`, and the static→dynamic bail-out). A `try/catch` around `fetch` that
  doesn't rethrow those will break the production build in a way that never shows up in dev.

# Onboarding

Read this once, end to end, before you write any code. It is the guided tour: what this repo is, where
things go, the rules that are not negotiable, and the exact steps for adding a feature.

The root [`README.md`](../README.md) has the full rationale, and **every directory under `src/` has its
own `README.md`** written for the moment you are standing in that folder. This document is the map that
tells you which of those to read and in what order.

## Table of contents

- [1. What this repo is](#1-what-this-repo-is)
- [2. Read these, in this order](#2-read-these-in-this-order)
- [3. This is not the Next.js you know](#3-this-is-not-the-nextjs-you-know)
- [4. The rules](#4-the-rules)
- [5. The two data paths](#5-the-two-data-paths)
- [6. Adding a feature](#6-adding-a-feature)
- [7. Error handling](#7-error-handling)
- [8. Setup](#8-setup)
- [9. Definition of done](#9-definition-of-done)
- [10. Things that do not exist yet](#10-things-that-do-not-exist-yet)

## 1. What this repo is

This is a **template, not a product.** The structure is the deliverable. The one feature included,
`example`, exists to be read and copied — never shipped. If your code does not look like
`src/features/example/`, you have done it wrong.

It is deliberately shaped to mirror the [backend](../../memoirproject-ai-backend), so a developer who has
worked in one repo can guess where things go in the other. Learn this mapping first; it answers most
"where does this go?" questions on its own.

| Backend (FastAPI) | Frontend (Next.js) | Job |
| --- | --- | --- |
| `src/api/` | `src/app/` | Entry points. Thin. Compose and delegate immediately. |
| `src/domain/<feature>/` | `src/features/<feature>/` | Everything about one feature, in one folder. |
| `src/models/*_models.py` (Pydantic) | `features/<feature>/schemas.ts` (Zod) | The contract. Zod is the twin of Pydantic. |
| `src/integrations/llm_client.py` | `src/lib/api/client.ts` | The only code that talks to the outside world. |
| `src/core/` | `src/lib/config/`, `src/app/providers.tsx` | App-wide setup: env validation, providers. |
| `src/utils/` | `src/utils/` | Generic helpers, not tied to a feature. Create when needed. |

Requests flow the same direction they do on the backend:

```
app/  ->  features/<feature>/  ->  lib/api/
routes    feature logic           HTTP: base URL, errors, validation
```

## 2. Read these, in this order

1. The root [`README.md`](../README.md) — the full rationale.
2. [`src/features/example/README.md`](../src/features/example/README.md) — the feature you will copy.
3. The example feature's source, in this order. Each file is commented to be read:
   `schemas.ts` → `api.ts` → `queries.ts` → `hooks.ts` → `components/GreetingCard.tsx` →
   `components/GreetingForm.tsx` → `index.ts` / `server.ts`.
4. The README for whichever directory you are about to edit:
   [`app/`](../src/app/README.md), [`features/`](../src/features/README.md),
   [`components/`](../src/components/README.md), [`lib/`](../src/lib/README.md).
5. [`AGENTS.md`](../AGENTS.md) — the same rules, condensed. It is what AI agents working in this repo
   are given, and it is a good checklist for you too.

**If you change what a directory holds, update that directory's `README.md` in the same commit.**

## 3. This is not the Next.js you know

This is the biggest source of confidently-wrong code. Model training data, blog posts, and Stack Overflow
answers describe an older Next.js.

- **Next.js 16.2.** `params` and `searchParams` are **async** — `await` them before use. `middleware` is
  now **`proxy`**. Turbopack is the default bundler. Cache Components (`use cache`) are **not** enabled,
  so the classic `cache` / `next: { revalidate, tags }` options apply.
- **React 19.2, Zod 4, Tailwind 4, TanStack Query 5, React Hook Form 7.**
- This project's shadcn build uses **[Base UI](https://base-ui.com), not Radix.** Primitives take a
  `render` prop rather than `asChild`. To style a link as a button, apply `buttonVariants()` to the
  `<Link>` — do not nest it inside `<Button>`.
- **The offline docs are in the repo: `node_modules/next/dist/docs/`** (`01-app/`, `02-pages/`,
  `03-architecture/`). Read the relevant guide there before writing code, and trust it over any external
  answer. Heed deprecation notices.

## 4. The rules

These are what keep the template from rotting. There are no exceptions.

1. **`app/` stays thin.** A page imports from a feature and composes it. No `fetch`, no URL, no business
   logic. If it is there, it belongs in `src/features/`.
2. **A feature is a folder.** Deleting `src/features/<name>/` must delete the feature completely.
3. **Only `src/lib/api/client.ts` calls `fetch`.** Everything else goes through `apiRequest`. Features
   describe *what* they want; the client owns *how* it happens.
4. **Never deep-import another feature.** Use its `index.ts` or `server.ts`, never a file inside it. If
   two features need the same thing, it belongs in `lib/` or `components/ui/`.
5. **`components/ui/` knows nothing about the domain.** If a prop mentions a greeting, a user, or a
   memoir, the component belongs in `features/<name>/components/`. Promote it to `src/components/` only
   once a **second** feature needs it — never speculatively.
6. **Every API response is validated by a Zod schema at the boundary.** `schema` is a required argument
   to `apiRequest`. No unvalidated data enters the app, in either direction.
7. **Validation rules and error messages live in `schemas.ts`, never in a component.** Forms use React
   Hook Form with `zodResolver` and the feature's existing request schema, so the field error text the
   user sees comes from the schema.
8. **`queries.ts` imports `server-only`.** Never re-export it from `index.ts` or any other
   client-reachable barrel.
9. **Never wrap `fetch` in a `try/catch` without calling `unstable_rethrow(error)` first.** Next.js
   signals control flow by throwing (`notFound()`, `redirect()`, and the static→dynamic bail-out).
   Swallowing those breaks the production build in a way that never shows up in dev.

One Zod schema per shape does three jobs at once — form validation, request validation, and the
TypeScript types (`z.input` / `z.output`). Change a rule in `schemas.ts` and all three follow. That is
why rule 7 matters: a message written in a component is a second place to update.

## 5. The two data paths

The example feature calls **one** backend endpoint **two** ways, because real features need both.

```
server path:  app/example/page.tsx  ->  queries.ts  ->  api.ts  ->  lib/api/client.ts  ->  backend
client path:  GreetingForm.tsx      ->  hooks.ts    ->  api.ts  ->  lib/api/client.ts  ->  backend
```

Both converge on `api.ts` and the same schemas, so an endpoint path and its contract are each written
exactly once.

> **The rule: default to the server path. Use the client path only when the data changes in response to
> the user** — mutations, polling, user-triggered refetch, optimistic updates.

Server-path data arrives as HTML with no loading spinner and no client round trip. Client-path data gets
caching, retries, and `isPending` / `isError` states from TanStack Query.

**Server and client components.** Files in `app/` are server components by default. Keep them that way.
Add `"use client"` only for state, effects, event handlers, or browser APIs, and push the directive as
far down the tree as you can — `layout.tsx` stays a server component precisely because `providers.tsx`
carries the directive instead.

**Why a feature has two barrel files.** `queries.ts` imports `server-only`, so a single barrel
re-exporting both paths would break the build for any client component that imported the feature — even
one that only wanted a type.

- `from "@/features/example"` — anywhere
- `from "@/features/example/server"` — server components only

**Cache keys are a factory, not hand-written arrays.** See `exampleKeys` in `hooks.ts`: `.all`
invalidates everything the feature owns, narrower keys invalidate one entry. Writing `["example", name]`
at each call site is how cache invalidation quietly stops working.

## 6. Adding a feature

Copy `src/features/example/`, rename it, delete the data path you do not need, and point `api.ts` at your
endpoint.

```
src/features/<name>/
  README.md        # what this feature is, and which data paths it uses
  schemas.ts       # Zod twin of the backend's Pydantic models   <- write this first
  api.ts           # one function per endpoint, calling apiRequest. The only place a path appears.
  queries.ts       # SERVER data path (imports "server-only")
  hooks.ts         # CLIENT data path (TanStack Query) — only if data changes on user action
  index.ts         # public surface, client-safe. Do NOT export api.ts.
  server.ts        # public surface, server-only. Only if queries.ts exists.
  components/      # components that know about this feature
src/app/<name>/page.tsx   # a thin route that composes it
```

Work in that order: `schemas.ts` → `api.ts` → pick a data path → barrels → route.

Where things go when you are unsure:

| You have… | It goes in… |
| --- | --- |
| A shape the backend sends or receives | `features/<name>/schemas.ts` |
| A new endpoint call | `features/<name>/api.ts` |
| A component only this feature uses | `features/<name>/components/` |
| A component two features use | `src/components/` |
| A helper only this feature uses | `features/<name>/utils.ts` |
| A pure helper two features use | `src/utils/` |
| A React hook two features use, with no domain knowledge | `src/hooks/` |
| App-wide infrastructure: a client, config, a provider | `src/lib/` |
| A second external service (analytics, uploads) | A new folder under `lib/`, built the way `api/` is |

Three directories hold code no single feature owns, and students mix them up constantly. The line is
dependencies: **`lib/`** is infrastructure you would mock in a test (the HTTP client, validated env, the
query client); **`utils/`** is pure functions you would never mock (`formatRelativeTime`, `groupBy`);
**`hooks/`** is generic React plumbing (`useDebouncedValue`, `useMediaQuery`) that never touches the
network. `src/hooks/` is *not* where data fetching goes — that is `features/<name>/hooks.ts`. And
`src/lib/utils.ts` is shadcn's `cn` helper, unrelated to `src/utils/`; leave it alone.

Both `src/utils/` and `src/hooks/` currently hold nothing but a `README.md`. Add a file the first time a
**second** caller needs it — the same promotion rule as `src/components/`.

Add UI primitives with the shadcn CLI rather than hand-writing them:

```bash
npx shadcn@latest add <component>
```

Editing files in `components/ui/` is fine — the CLI copies them into the repo precisely so you can — but
expect to re-apply your changes if you ever re-add that component.

Other route-level files worth knowing: add a nested `error.tsx` when a section should be able to fail
without taking the route with it, and a `loading.tsx` next to a page to stream a fallback while its data
resolves.

## 7. Error handling

`lib/api/client.ts` normalizes **every** failure into an `ApiError` with one of three codes. Components
never see a raw `TypeError`, a bare `Response`, or a `ZodError`.

| Code | Meaning | What to do |
| --- | --- | --- |
| `network` | No answer — backend down, DNS, or timeout | Retry; show "can't reach the server" |
| `http` | Non-2xx. FastAPI's `detail` — a string, or a 422 validation array — is unwrapped into the message | Show it; a 4xx means our request was wrong |
| `contract` | 200, but the body failed the Zod schema | **Fix the code.** Frontend and backend have drifted |

`contract` is the valuable one. Without it, a renamed backend field shows up as `undefined` three
components deep. With it, you get a message naming the offending field at the moment it arrives.

Failures surface through `app/error.tsx` (server path) and `isError` (client path). Retry policy is set
once in `lib/query/client.ts`: 4xx and `contract` are never retried because repeating the request cannot
help, and mutations are never retried because the request may have been applied before the response was
lost.

**Do this exercise.** It is the fastest way to understand the layering:

1. **Stop the backend**, reload `/example` → `app/error.tsx` renders "Backend unavailable"
   (`code: "network"`).
2. **Rename `message` to `text`** in `features/example/schemas.ts`, reload → a `contract` error naming
   the field. That is the drift guard doing its job.
3. **Submit an empty name** → the schema blocks it in the browser; no request is ever sent.

## 8. Setup

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

Visit `/example` to see both data paths against the live backend. The React Query Devtools button sits in
the bottom-right corner in development — open it while reading `features/example/hooks.ts` to watch the
cache populate and invalidate.

- **Environment variables** are Zod-validated at module load in `lib/config/env.ts`, so a missing or
  malformed value fails immediately with a readable message rather than as a mystery 404 later. Read each
  variable as a literal `process.env.X` member access: Next.js inlines `NEXT_PUBLIC_*` into the client
  bundle by statically replacing exactly that expression, so passing `process.env` wholesale to `.parse()`
  works on the server and silently yields `undefined` in the browser.
- **The import alias is `@/*` → `src/*`.** Use it; no `../../..` chains.
- **VS Code:** accept the recommended extensions prompt (`.vscode/extensions.json`) for Tailwind
  IntelliSense, inline ESLint, and readable TypeScript errors.

## 9. Definition of done

```bash
npm run verify     # typecheck + lint — must be green
```

`npm run lint` runs with `--max-warnings 0`. Also available: `npm run build`.

Before you open a PR: `npm run verify` passes, the directory READMEs match what the directories now hold,
and nothing you added violates a rule in section 4.

## 10. Things that do not exist yet

- **No authentication layer.** The backend has none today — CORS is open, no middleware. Do not invent
  one; raise it first. When it arrives, the token belongs in `lib/api/client.ts`, the single place
  requests are built, and nowhere else.
- **`src/utils/` and `src/hooks/` are empty** — each holds only a `README.md` describing what goes in it.
  That is deliberate: you add the first file when a **second** caller needs it. Read
  [`src/utils/README.md`](../src/utils/README.md) and [`src/hooks/README.md`](../src/hooks/README.md)
  before putting anything in either one.
- **No `loading.tsx` or nested `error.tsx` anywhere yet.** Both are one-file additions next to a page —
  add them when a route needs streaming or isolated failure, not upfront.

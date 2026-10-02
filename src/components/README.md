# src/components

Components shared across features. **Nothing here knows about your domain.**

The test: if a component's props mention a greeting, a user, or an order, it is not a shared
component — it belongs in `src/features/<feature>/components/`.

## Structure

```
components/
  ui/          # shadcn primitives — Button, Card, Input, Label
```

`ui/` is generated and updated by the shadcn CLI:

```bash
npx shadcn@latest add <component>
```

Prefer adding a primitive with the CLI over hand-writing one. Editing files in `ui/` is fine — the
CLI copies them into your repo precisely so you can — but expect to re-apply changes if you ever
re-add that component.

Note: this project's shadcn build uses [Base UI](https://base-ui.com), not Radix. Primitives take a
`render` prop rather than `asChild`. To style a link as a button, apply `buttonVariants()` to the
link instead of nesting it inside `<Button>`.

## Adding your own shared components

Create sibling folders as the need appears — `layout/` for shells and navigation, `forms/` for
field wrappers. Put each non-trivial component in its own folder:

```
components/layout/Sidebar/
  Sidebar.tsx
  index.ts
```

Do not create these folders speculatively. A component belongs here once a **second** feature needs
it — until then it lives in the feature that uses it.

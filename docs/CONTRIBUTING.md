# Contributing

## Development Setup

```bash
npm install
npm run dev
```

Before handing off changes, run:

```bash
npm test
npm run lint
npm run build
```

## Product Principles

- Spanish-first interface.
- Local-first honesty: do not imply backend sync, live dispatch, or public publishing.
- Task-first operations: report, verify, assign, resource, shelter, check-in, export.
- Privacy-minimal records, especially for people and medical context.
- Compact, calm UI suitable for repeated operational use.

## Code Guidelines

- Keep domain types explicit in `src/App.tsx`.
- Persist new local records with namespaced `colombia-relief-router-*` keys.
- Add tests when changing guided flows, persistence, assignment, export, or privacy gates.
- Use existing lucide-react icons and CSS patterns before adding new visual dependencies.
- Keep cards at the existing 8px radius.
- Do not add external hotlinked images.

## Review Checklist

- Does the first screen still show the three emergency actions clearly on mobile?
- Can a new report be created without opening the coordination console?
- Are unverified cases blocked from direct suggested assignment confirmation?
- Does every export path avoid collecting unnecessary sensitive data?
- Do tests, lint, and build pass?

## Documentation Checklist

When adding or changing product behavior, update whichever file is most relevant:

- `README.md` for public GitHub-facing usage, setup, and feature overview.
- `docs/PRD.md` for operations-desk requirements.
- `docs/GUIDED_RESPONSE_PRD.md` for guided-mode requirements.
- `docs/BRAND.md` for Ape 2253 / Rescue Coordinator identity guidance.

# Colombia Relief Router

Spanish-first, local-first disaster-response router for converting field reports into verified, assigned relief work after a major earthquake in Colombia.

Colombia Relief Router is built for a municipal or volunteer coordination desk that needs to answer: what is urgent, what is verified, who owns it, what is blocked, and what can safely be shared?

## Resumen en español

**Colombia Relief Router** es una mesa operativa para respuesta a desastres. Permite registrar necesidades, verificar reportes, asignar equipos, administrar recursos y albergues, hacer check-ins seguros de personas/grupos, y exportar SITREPs en formatos copiables.

La UX es primero en español, funciona en el navegador, guarda datos en `localStorage` y evita depender de un mapa falso o de un backend que no existe.

## Demo

- Local app: `npm run dev`
- Production build: `npm run build`
- Hosting project: configured in `.openai/hosting.json`
- Live URL: https://mesa-respuesta-colombia.korion2525.chatgpt.site/
- Collaboration repo: https://github.com/KeNFT1/Colombia

## Core Features

| Area | What it does | Safety posture |
| --- | --- | --- |
| Guided intake | One-question-at-a-time flows for reporting a need or offering help | Spanish plain-language prompts and sensitive-data reminders |
| Crisis feed | Sorts open cases by criticality, verification state, assignment state, blockers, and recency | List-first triage avoids fake live-map confidence |
| Verification | Tracks minimum checks before assignment or sharing | New reports must be verified before suggested assignment confirmation |
| Assignment | Suggests compatible teams by need and availability, then creates ETA-backed assignments | Requires explicit confirmation |
| Resources | Tracks supplies, transport, communications gear, shelter capacity, and requests | Exportable operational records |
| People check-ins | Uses safe labels for families/groups and requires privacy acknowledgement | No full names, IDs, private addresses, or medical details |
| SITREP | Generates copyable WhatsApp, radio, and email formats | Includes a privacy guardrail in every report |
| Export | Downloads JSON and CSV packages from local data | User controls what leaves the browser |

## Quick Start

```bash
npm install
npm run dev
```

Open the Vite URL shown in your terminal.

## Test And Build

```bash
npm test
npm run lint
npm run build
```

What these cover:

- `npm test`: Vitest + Testing Library component coverage for guided intake, resource offers, assignment confirmation, CRUD paths, persistence, and export.
- `npm run lint`: Oxlint static checks.
- `npm run build`: TypeScript project build, Vite production build, and `scripts/build-sites-worker.js`.

## How To Use

1. Start on **Inicio**.
2. Choose **Reportar ayuda necesaria**, **Tengo recursos / puedo ayudar**, or **Coordinar casos**.
3. Select the current role: ciudadano/enlace, voluntario, coordinador, albergue, or logistica.
4. Enter only operationally necessary information.
5. Verify reports before assigning teams or sharing summaries.
6. Use **Crear reporte para compartir** for SITREP text.
7. Export JSON/CSV before changing browser, device, or deployment.

## Architecture

This is a React/Vite/TypeScript single-page app.

```text
src/
  App.tsx        Main domain model, seeded data, localStorage persistence, UI flows
  App.css        Operational visual system and responsive layout
  index.css      Global browser defaults
  App.test.tsx   Component and workflow tests
docs/
  PRD.md                  Operations-desk product requirements
  GUIDED_RESPONSE_PRD.md  Guided response mode requirements
  BRAND.md               BAYC #2253 rescue-coordinator treatment
  CONTRIBUTING.md        Collaboration and review guide
```

The app is intentionally local-first:

- No auth.
- No backend API.
- No server sync.
- No real geocoding.
- No automatic public publishing.
- Browser `localStorage` is the source of truth during a session.

## Data Model

Main collections:

- `Caso`: need report with municipality, department, need type, priority, affected count, contact/source, coordinates/reference, notes, state, owner, and update time.
- `Voluntario`: team or person record with base, role, skills, availability, shift, state, and operational contact.
- `Recurso`: inventory item with type, location, quantity, state, and owner.
- `Albergue`: shelter capacity, occupancy, needs, state, and responsible contact.
- `Persona`: privacy-minimal family/group check-in label, municipality, state, minimal note, and contact.
- `Asignacion`: case-to-team assignment with status, ETA, owner, and optional blocker.
- `Solicitud`: case-linked resource request with needed amount, delivered amount, point, and status.

LocalStorage keys are namespaced under `colombia-relief-router-*`.

## Safety And Privacy

Do not enter or export:

- Cedulas or government ID numbers.
- Full names of vulnerable people.
- Full private addresses.
- Medical histories or diagnoses.
- Unverified rumors as public facts.

Operational guidance:

- Treat all records as sensitive until verified.
- Share SITREPs only through authorized channels.
- Review contact, note, and people fields before export.
- Prefer safe labels like `Grupo familiar A` over personal identifiers.
- Keep source/contact descriptions operational, such as `enlace local de salud` or `radio despacho`.

## BAYC #2253 Brand Treatment

The project now includes a restrained **Ape 2253 / Rescue Coordinator** identity layer: radio, triage, dispatch, and rescue-coordination language.

Important rights note: this repository does **not** include verified BAYC #2253 token artwork or trait metadata. The app therefore uses a tasteful operations-themed badge/card with token id `#2253`, not a hotlinked image or trait claim. Any future use of official Bored Ape Yacht Club #2253 artwork should only happen if the project owner controls or has rights to that token artwork.

See [docs/BRAND.md](docs/BRAND.md) for usage guidance.

## Collaboration

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

Good first areas:

- Add focused tests around additional guided-flow branches.
- Add import validation for JSON restore flows.
- Improve print/PDF SITREP formatting.
- Add optional offline installation metadata.
- Add screenshots and short field walkthroughs for the production app.

## Roadmap

- Import JSON package from another device.
- Printable SITREP and shelter manifest views.
- Offline/PWA install support.
- Optional QR handoff for opening the guided mode on a phone.
- More granular audit log for verification and assignment changes.
- Partner-ready data dictionary for interoperating with municipal systems.

## References

- AP earthquake context: https://apnews.com/article/26fd40f93272d834fced47a4a673edc9
- U.S. Embassy Colombia alert: https://co.usembassy.gov/natural-disaster-alert-alert-7-4-earthquake-in-choco-august-10-2026/
- World Bank on disaster risk management in Colombia: https://blogs.worldbank.org/en/latinamerica/como-colombia-sistema-mas-resiliente-ante-desastres
- Sahana Foundation: https://sahanafoundation.org/
- Ushahidi: https://www.ushahidi.com/
- Crisis Cleanup: https://crisiscleanup.org/about
- KoBoToolbox: https://hhi.harvard.edu/kobotoolbox

## License

No license file is currently included. Add one before accepting external contributions or reuse.

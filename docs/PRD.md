# Ruta Colombia PRD - Design Pass

## Context

Ruta Colombia is a local-first disaster-response command center for turning field reports into verified, assigned work. The product supports intake, teams/users, inventory, shelters, people check-ins, assignments, local persistence, and export.

The design pass shifts the product from separate CRUD tabs into a calm operations desk. In a crisis, the primary job is helping a coordinator answer: what is urgent, what is verified, who owns it, what is blocked, and what can safely be shared?

## Goals

1. Put operational risks on the first screen of the console.
2. Make the core workflows obvious: register, verify, assign, resource, shelter, check-in, export.
3. Connect modules so cases suggest matching teams, resources, shelters, and requests.
4. Reinforce privacy-minimal handling for people records.
5. Keep the app Spanish-first, local-first, responsive, and public-demo safe.

## Users

- Municipal coordinator: scans risk, validates reports, assigns ownership, exports SITREP.
- Verifier: confirms source, location, need, and privacy review.
- Logistics lead: manages inventory, requests, shelter capacity, and fulfillment state.
- Team lead: tracks assignment status, ETA, blockers, and completion.

## Design Principles

- Task-first, not tab-first.
- Dense but calm.
- Minimal sensitive data.
- Progressive disclosure.
- Local-first honesty.

## Required Scope

### Operations Cockpit

Show a risk band with:

- Critical cases.
- Unverified cases.
- Verified but unassigned cases.
- Blocked assignments.
- Shelter capacity risk.
- Resource gaps and open requests.

Each card should guide the user toward the relevant work queue.

### Task Queues

The console should expose filters/queues for:

- Critical.
- Unverified.
- Unassigned.
- Blocked.
- Shelter risk.
- Resource gaps.
- Need category.

### Case Detail Panel

Selecting a case should show:

- Summary, priority, need, people affected, source/contact, notes.
- Verification checklist.
- Suggested matching teams.
- Suggested matching resources.
- Suggested shelters when relevant.
- Quick actions for verification and assignment preparation.

### Assignment Flow

Assignments should:

- Prefer selected or verified/unassigned cases.
- Suggest compatible teams.
- Track ETA, responsible owner, status, and blocker note.
- Mark assigned cases as assigned and update ownership.

### Resource Requests

The app should support concrete supply requests:

- Case.
- Item.
- Quantity needed.
- Delivered amount.
- Delivery point.
- Status.

Requests must persist locally and export with operational data.

### People Check-ins

People records must use safe labels and include an explicit privacy reminder before saving:

- No full names.
- No IDs.
- No private full addresses.
- No medical details.

### Spanish UX Polish

Use consistent operational Spanish:

- Directorio instead of Voluntarios where the module includes users/teams.
- Casos, Recursos, Albergues, Personas, Exportar/SITREP.
- Avoid technical terms in visible UI.

### Visual Design

- Reduce heavy shadows.
- Prefer compact 8px radius controls/cards.
- Keep queue rows and forms mobile-safe.
- Use priority/status color sparingly and consistently.

## Out of Scope

- Authentication.
- Backend database or sync.
- Real maps/geocoding.
- Messaging integrations.
- Public identity collection.

## Acceptance Criteria

- A coordinator can open Consola and identify top risks immediately.
- A verifier can select a case and process verification from the detail panel.
- A coordinator can prepare an assignment from selected-case suggestions.
- A logistics lead can create and update resource requests.
- People check-ins require privacy-minimal confirmation.
- JSON/CSV export includes operational modules where practical.
- `npm run lint` and `npm run build` pass.
- Production deployment returns HTTP 200.


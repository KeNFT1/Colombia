# Roadmap

This roadmap turns the current local-first demo into a contributor-friendly plan for a real emergency-response product. It is intentionally practical: each milestone includes issue-sized work, acceptance criteria, likely owners, and dependencies.

The app must keep its current posture while it grows:

- Spanish-first user experience for Colombia response teams.
- Local-first honesty until backend sync exists.
- Privacy-minimal records for people, medical context, contact details, and locations.
- List-first coordination; maps support decisions but do not replace verification.
- Rights-safe Ape 2253 / Rescue Coordinator branding, without unverified BAYC artwork or trait claims.

## Priority Labels

| Label | Meaning |
| --- | --- |
| `P0 - Respuesta segura` | Required before real responders should rely on the feature during an incident. |
| `P1 - Operación base` | Core coordination capability for trusted pilots. |
| `P2 - Integración y escala` | Enables broader partner use, data exchange, or higher-volume operations. |
| `P3 - Mejora` | Quality, polish, or optional workflow depth after the core is stable. |

## Suggested Roles

| Role | Contribution area |
| --- | --- |
| Product / Incident Lead | Defines response workflows, acceptance criteria, and operational priorities. |
| Frontend Engineer | React UI, accessibility, PWA, offline flows, import/export UX. |
| Backend Engineer | API, database, sync, auth, audit logging, deployment operations. |
| Data / GIS Engineer | Geocoding, map layers, data dictionary, interoperability, imports. |
| Security / Privacy Reviewer | Threat model, data minimization, access control, retention, export safety. |
| QA / Accessibility Reviewer | Test plans, manual field checks, mobile checks, Spanish copy review. |
| Localization Reviewer | Spanish-first terminology, regional Colombian vocabulary, English contributor text. |
| Field Partner / Volunteer Coordinator | Validates volunteer, shelter, logistics, radio, and SITREP workflows. |

## Phase 0: Current Baseline And Hardening

Goal: make the existing local-first app easier to review, test, and safely pilot without implying unsupported backend features.

Target status: demo/pilot readiness on one device per coordinator.

Dependencies: current React/Vite app, existing localStorage data model, README/PRD/brand docs.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Document current limits in UI and docs | Product / Frontend | Existing README and PRDs | README, contributing docs, and visible export/offline copy all clearly state no backend, no auth, no sync, and local-only storage. |
| P0 | Add import validation spec for JSON restores | Product / Security | Current export format | A doc section defines required fields, rejected sensitive fields, version handling, and user-facing error states. |
| P0 | Expand component tests around guided intake and privacy gates | Frontend / QA | Existing Vitest setup | Tests cover need intake, help offer, people check-in privacy acknowledgement, assignment confirmation, and export guardrails. |
| P1 | Add docs screenshots/walkthrough checklist | QA / Localization | Stable UI state | A contributor can follow a Spanish walkthrough for reporting a need, offering resources, assigning a case, and copying SITREP. |
| P1 | Define incident data dictionary v0 | Data / Product | Current TypeScript types | `Caso`, `Voluntario`, `Recurso`, `Albergue`, `Persona`, `Asignacion`, and `Solicitud` fields are documented with Spanish labels, English notes, allowed values, and privacy classification. |

## Phase 1: Backend, Sync, Auth, And Roles

Goal: move from single-device localStorage to trusted multi-user coordination while preserving offline-friendly workflows.

Target status: closed pilot for one municipality, NGO team, or volunteer operations desk.

Dependencies: data dictionary v0, privacy threat model, deployment target, database choice.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Choose backend architecture | Product / Backend / Security | Phase 0 data dictionary | Architecture decision record compares hosted Postgres/Supabase/Firebase/custom API, conflict model, cost, Colombia data residency considerations, and offline constraints. |
| P0 | Implement authenticated API foundation | Backend | Architecture decision | API supports create/read/update for core records with validation, server timestamps, stable IDs, and error responses documented for the frontend. |
| P0 | Add auth and role model | Backend / Security / Frontend | API foundation | Roles exist for `coordinador`, `verificador`, `logistica`, `albergue`, `voluntario`, and `solo lectura`; protected actions require appropriate role; role labels stay Spanish-first in the UI. |
| P0 | Add audit log for sensitive changes | Backend / Security | Auth model | Case verification, assignment, status changes, people check-ins, exports, and deletes write immutable audit events with actor, timestamp, before/after summary, and reason when applicable. |
| P1 | Build sync adapter in the frontend | Frontend / Backend | API foundation | App can switch between local demo data and authenticated backend data through a small adapter layer; local demo mode still works. |
| P1 | Define conflict resolution UX | Product / Frontend | Sync adapter | When two users edit the same case, UI shows a clear Spanish conflict state and lets a coordinator keep local, keep server, or merge operational notes. |
| P1 | Add invite/onboarding flow for trusted partners | Frontend / Backend | Auth model | A coordinator can invite a team member, assign a role, deactivate access, and see last activity. |

## Phase 2: Offline, PWA, QR, And Field Handoff

Goal: make the app reliable for phones and unstable connectivity without hiding sync risk.

Target status: field-friendly pilot where coordinators can keep working through outages and reconnect later.

Dependencies: sync adapter, conflict rules, service worker strategy, install metadata.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Add PWA install metadata and offline shell | Frontend / QA | Current Vite build | App installs on mobile/desktop, loads the shell offline, and shows `Sin conexión: puedes seguir registrando` when network is unavailable. |
| P0 | Queue offline writes | Frontend / Backend | Sync adapter | New reports, updates, and assignments created offline are queued with visible pending state and sync automatically when connection returns. |
| P0 | Add export-before-signout warning | Frontend / Security | Auth/offline model | Users are warned before signing out or clearing local data if unsynced records exist. |
| P1 | QR handoff for guided mode | Frontend / Product | Stable public URL or pilot URL | Coordinator can display/copy a QR link that opens guided intake on a phone; QR copy explains local storage and privacy limits. |
| P1 | Low-bandwidth mode | Frontend / QA | PWA shell | App remains usable on slow mobile connections by avoiding large assets and favoring compact case lists. |
| P2 | Device-to-device transfer package | Frontend / Security | Import/export validation | User can export an encrypted or clearly labeled transfer package and import it on another device with validation and duplicate detection. |

## Phase 3: Maps, Geocoding, And Location Confidence

Goal: add spatial context without creating false certainty in disaster conditions.

Target status: coordinators can prioritize by municipality, route risk, shelter proximity, and verified location confidence.

Dependencies: location data model, geocoding provider decision, privacy review, offline requirements.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Add location confidence model | Data / Product / Frontend | Data dictionary | Each case location has confidence labels such as `Referencia textual`, `Municipio confirmado`, `Coordenada aproximada`, and `Coordenada verificada`; UI never presents unverified pins as exact. |
| P1 | Integrate geocoding behind review | Data / GIS / Frontend | Provider decision | Text locations can produce candidate coordinates, but a verifier must approve before a coordinate is marked verified. |
| P1 | Add map as optional context view | Frontend / GIS | Location confidence model | Map appears as a support view with list-first triage preserved; pins show confidence, need, priority, and last verified time. |
| P1 | Shelter and resource proximity suggestions | GIS / Frontend | Verified/approximate coordinates | Case detail can suggest nearby shelters/resources with distance and confidence labels. |
| P2 | Import official boundary and infrastructure layers | GIS / Product | Data licensing review | Departments, municipalities, shelters, hospitals, roads, and blocked routes can be loaded from rights-cleared datasets with documented provenance. |
| P2 | Offline map tiles strategy | GIS / Frontend / Security | Deployment and licensing decision | Pilot regions can use cached or packaged maps without violating provider terms or leaking sensitive field activity. |

## Phase 4: Import, Export, And Interoperability

Goal: make the project useful alongside municipal systems, NGOs, spreadsheets, and established crisis-response tools.

Target status: partner-ready data exchange for trusted pilots.

Dependencies: data dictionary, backend API, privacy policy, export review.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Version JSON exports | Frontend / Backend / Data | Data dictionary | Exports include schema version, generated timestamp, source app version, and clear privacy warning. |
| P0 | Build validated JSON import | Frontend / Security | Import validation spec | Import preview shows records added/updated/skipped, warns about sensitive fields, and never silently overwrites newer records. |
| P1 | Add CSV templates for field partners | Data / Localization | Current CSV exports | Templates are documented for cases, teams, resources, shelters, and requests with Spanish headers and validation notes. |
| P1 | Add partner data dictionary docs | Data / Product | Schema versioning | External partners can map their fields to this app using Spanish labels, English contributor notes, allowed values, and examples. |
| P2 | Support KoBoToolbox/Ushahidi/Sahana-style intake mapping | Data / Backend | API and import pipeline | Common field-survey exports can be imported through mapping profiles with rejected-field reporting and privacy warnings. |
| P2 | Add API webhooks or polling exports | Backend / Security | Auth and audit log | Trusted systems can fetch changed records or receive webhooks with scoped tokens, audit events, and rate limits. |

## Phase 5: Volunteer, Team, Shelter, And Logistics Workflows

Goal: deepen the operational loops that turn reports into completed work.

Target status: response desk can coordinate people, teams, supplies, shelters, and blocked routes across multiple shifts.

Dependencies: auth roles, backend sync, audit log, location confidence model.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Team shift and availability workflow | Product / Frontend / Backend | Auth roles | Team leads can mark availability, capacity, base, skills, shift window, and contact channel; assignment suggestions use those fields. |
| P0 | Assignment lifecycle | Frontend / Backend / QA | Audit log | Assignments support `pendiente`, `en camino`, `en sitio`, `bloqueado`, `cerrado`, and `reasignado`; every transition has timestamp and actor. |
| P1 | Volunteer intake review queue | Product / Frontend | Auth roles | Public/low-trust offers land in a review queue before they can receive sensitive case details. |
| P1 | Shelter manifest without unsafe identity capture | Product / Security / Frontend | Privacy model | Shelters track capacity, occupancy bands, needs, and safe group labels without requiring full names, IDs, or private medical details. |
| P1 | Logistics request fulfillment flow | Logistics Lead / Backend / Frontend | Resource requests | Requests track needed, committed, in transit, delivered, shortfall, owner, ETA, and blockers. |
| P2 | Radio/WhatsApp-ready dispatch packets | Product / Localization / Frontend | Assignment lifecycle | Coordinator can copy a concise dispatch packet with case code, location confidence, need, ETA, team, and privacy guardrail. |
| P2 | Mutual aid partner directory | Product / Backend / Security | Auth roles | Trusted organizations can be listed with capabilities, contact channel, coverage area, verification state, and access scope. |

## Phase 6: Privacy, Safety, QA, Accessibility, And Localization

Goal: make the app safer, more inclusive, and easier to operate under stress.

Target status: ready for public open-source collaboration and serious partner review.

Dependencies: stable workflows, auth model, export/import, accessibility baseline.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Write privacy threat model | Security / Product | Data dictionary and auth model | Threat model covers vulnerable people, location exposure, volunteer trust, exports, screenshots, logs, admin misuse, and retention. |
| P0 | Add retention and delete policy | Security / Backend / Product | Audit log | Policy states what can be deleted, what remains in audit logs, and how incident data is archived after response. |
| P0 | Accessibility pass for mobile and keyboard | Frontend / QA | Current UI | Main flows meet practical WCAG AA targets for contrast, labels, focus, touch targets, and keyboard navigation. |
| P1 | Spanish copy review for Colombian field use | Localization / Field Partner | Stable UI | User-facing labels are reviewed for clarity, stress use, and Colombian terminology; English remains acceptable for contributor docs. |
| P1 | Add manual QA scripts | QA | Core workflows | Docs include test scripts for need report, help offer, verify, assign, shelter update, request fulfillment, import/export, offline queue, and SITREP. |
| P1 | Add end-to-end test suite | Frontend / QA | Stable flows | Playwright or equivalent covers smoke paths on desktop and mobile widths. |
| P2 | Security review for public deployment | Security / Backend | Production environment | Review checks CSP, auth/session handling, rate limits, logs, secrets, dependency updates, and export access. |

## Phase 7: Deployment, Operations, And Open Source Collaboration

Goal: make the project maintainable as an open-source public-good app while supporting real deployments.

Target status: documented production operations and contributor pipeline.

Dependencies: backend architecture, deployment target, license decision, contribution guidelines.

| Priority | Work Item | Suggested Owner | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| P0 | Add license and contribution policy | Project Owner / Maintainer | Legal/project decision | Repository includes a license, contribution policy, code of conduct decision, and clear note about emergency-use limitations. |
| P0 | Define production deployment runbook | Backend / Operations | Deployment target | Runbook covers environment variables, migrations, backups, restore drills, monitoring, incident contacts, and rollback. |
| P0 | Configure CI checks | Maintainer / Frontend | Existing npm scripts | Pull requests run tests, lint, build, and docs link checks where practical. |
| P1 | Add issue templates and labels | Maintainer / Product | Roadmap priorities | GitHub issues support bug, feature, field feedback, data/privacy concern, docs, and good-first-issue templates. |
| P1 | Add release checklist | Maintainer / QA | CI checks | Each release records build status, migrations, QA results, accessibility smoke check, privacy review notes, and deployment URL. |
| P1 | Monitoring and alerting | Backend / Operations | Production backend | Production tracks availability, API errors, sync failures, queue backlog, and failed imports without logging sensitive content. |
| P2 | Partner pilot playbook | Product / Field Partner | Stable pilot workflows | A municipality or NGO can run a small pilot with onboarding, roles, sample data, field exercise, feedback form, and after-action review. |

## Near-Term Sprint Plan

Suggested two-week sprint, scoped for contributors before deeper backend work.

| Day Range | Focus | Issues | Exit Criteria |
| --- | --- | --- | --- |
| Days 1-2 | Align scope and safety | Confirm license direction; open issues from this roadmap; define data dictionary v0 outline. | GitHub project has labels, roadmap issues, and maintainer-approved priority order. |
| Days 3-5 | Data and import/export docs | Document schema versioning; write JSON import validation rules; define CSV templates. | `docs/` contains enough detail for a contributor to implement validated import without guessing. |
| Days 6-8 | Test and QA depth | Add missing tests for privacy gates, assignment confirmation, export, and guided flows; draft manual QA script. | `npm test`, `npm run lint`, and `npm run build` pass with broader workflow coverage. |
| Days 9-10 | PWA planning and backend decision | Draft architecture decision record for backend/sync/auth; scope PWA offline shell. | Maintainers can choose the next build milestone with dependencies and risk tradeoffs visible. |

## Definition Of Ready For Real-World Pilot

Before any field partner treats the app as operational software, the project should have:

- Authenticated backend with role-based access.
- Audited verification, assignment, export, and delete actions.
- Offline queue with visible sync state and conflict handling.
- Privacy threat model and retention policy.
- Validated import/export with schema versions.
- Accessibility-tested Spanish-first critical workflows.
- Deployment runbook, backups, monitoring, and rollback.
- Partner onboarding and emergency-use limitation notes.

Until then, this project should be described as a local-first coordination prototype and planning tool, not an official emergency service.

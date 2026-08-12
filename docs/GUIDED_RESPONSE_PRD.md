# Guided Response Mode PRD

## Purpose

Make Mesa de Respuesta usable by non-technical people coordinating or participating in a large emergency front. The current console is useful for operations staff, but it still feels like an admin dashboard. Guided Response Mode should sit on top of the existing local-first console and turn the first experience into a simple crisis workflow: report need, offer help, or coordinate cases.

The product remains Spanish-first, Lulo Studios branded, browser-based, offline/local-first, and exportable. No backend, accounts, fake live maps, or deployment are required for this scope.

## Target Users

- Ciudadano/enlace: reports a need for a family, block, vereda, shelter, hospital, school, or local group.
- Voluntario: offers time, transport, supplies, verification, communications, or specialized skills.
- Coordinador: triages cases, verifies reports, assigns teams, shares SITREPs.
- Albergue: reports capacity, needs, arrivals, and urgent blockers.
- Logística: manages resources, delivery points, transport, and fulfillment.

## Product Shape

Guided Response Mode is the default first screen. The existing console stays available behind **Modo coordinación** for trained users.

### First Screen

Show three giant actions, full-width on mobile, with clear icons and no dashboard metrics above them:

1. **Reportar ayuda necesaria**
   - Helper copy: `Cuéntanos qué se necesita y dónde. No necesitas saber usar la consola.`
   - Starts need intake.
2. **Tengo recursos / puedo ayudar**
   - Helper copy: `Registra transporte, alimentos, agua, cupos, equipos o tiempo voluntario.`
   - Starts offer intake.
3. **Coordinar casos**
   - Helper copy: `Ver casos urgentes, asignar equipos y preparar reporte SITREP.`
   - Opens role picker, then crisis feed or coordination console.

Also show a small, secondary **Abrir en este teléfono** section with:

- QR code placeholder/framing for the current URL.
- Copy link button: `Copiar enlace`.
- Offline status: `Datos guardados en este dispositivo`.

## Role Picker

After the first action, ask: **¿Cuál es tu rol ahora?**

Options:

- `Ciudadano / enlace comunitario`
- `Voluntario`
- `Coordinador`
- `Albergue`
- `Logística`

Role determines language and default questions, not permissions. Coordinators can still enter **Modo coordinación**. Other roles should stay in guided flows unless they explicitly choose coordination.

## Guided Intake

Use WhatsApp-style one-question-at-a-time screens: one prompt, large answer area, back button, progress indicator, and template chips. Avoid long forms for first-time users.

### Need Intake

Suggested question sequence:

1. `¿Qué se necesita primero?`
   - Template buttons: `Atención médica`, `Agua`, `Alimentos`, `Albergue`, `Transporte`, `Rescate/escombros`, `Comunicación`, `Buscar familia`.
2. `¿Dónde está pasando?`
   - Accept municipality, neighborhood/vereda, landmark, or coordinates.
   - Copy: `Si no sabes coordenadas, escribe una referencia clara.`
3. `¿Cuántas personas están afectadas?`
   - Chips: `1-5`, `6-20`, `21-50`, `50+`, `No sé`.
4. `¿Qué tan urgente es?`
   - Plain labels below.
5. `¿Quién puede confirmar este reporte?`
   - Accept phone/radio/contact role. Warn against sensitive data.
6. `¿Qué detalle ayuda a enviar apoyo?`
   - Free text, with examples.
7. Review screen:
   - `Enviar a triage`
   - `Guardar como borrador`
   - `Compartir por WhatsApp`

### Help/Resource Intake

Suggested question sequence:

1. `¿Qué puedes ofrecer?`
   - Templates: `Vehículo`, `Agua`, `Alimentos`, `Medicamentos/equipo`, `Cupos de albergue`, `Radio/comunicaciones`, `Manos voluntarias`, `Maquinaria`.
2. `¿Dónde está disponible?`
3. `¿Cuánto hay o cuántas personas pueden ayudar?`
4. `¿Desde cuándo y por cuánto tiempo?`
5. `¿A quién contactan?`
6. Review: `Registrar recurso` and optional `Ver casos compatibles`.

## Plain-Language Triage

Replace or supplement admin labels with field-readable labels:

- `Atender ya`: life safety, medical, trapped people, no water, shelter collapse.
- `Atender hoy`: urgent but not immediate life safety.
- `Puede esperar`: important, not urgent today.
- `Necesita verificar`: not enough source/location/detail.
- `Ya tiene responsable`: assigned and moving.
- `Cerrado`: resolved or no longer active.

Internally these can map to existing priority/status fields. The UI should show the plain label first and the system label only in coordination mode if needed.

## Crisis Feed

The main coordination surface should be list-first, not map-first. Maps are optional context only because fake pins create false confidence during a disaster.

Default feed order:

1. `Atender ya`
2. `Necesita verificar`
3. `Atender hoy`
4. `Sin responsable`
5. `Bloqueado`
6. Recently updated

Each feed item should show:

- Need label, municipality/reference, people affected, last update.
- Plain status: `Necesita verificar`, `Listo para asignar`, `En camino`, `Bloqueado`.
- One primary action based on state: `Verificar`, `Asignar`, `Actualizar ETA`, `Cerrar`.
- Secondary: `Copiar resumen`.

## One-Click Assignment Suggestions

For cases ready to assign, show **Asignación sugerida** with one primary button:

- `Asignar a [equipo]`

Suggestion logic can use existing local data:

- Match team skills to case need.
- Prefer `disponible` over `asignado` over `descanso`.
- Prefer same municipality/base if present.
- Include compatible resource or shelter suggestion when relevant.
- If no team exists, show `Crear solicitud` or `Pedir voluntario`.

Before committing, show a lightweight confirmation:

`Asignar COL-001 a Brigada médica occidente con ETA 20 min?`

On confirm, create/update assignment, mark case assigned, and make the next action `Compartir por WhatsApp/radio`.

## Template Buttons

Templates should reduce typing under stress. Use chips/buttons in intake, case updates, resource requests, and SITREP.

Common need templates:

- `Falta agua potable`
- `Personas heridas`
- `Familias sin albergue`
- `Vía bloqueada`
- `Necesitan transporte`
- `Sin comunicación`
- `Faltan alimentos`
- `Personas no localizadas`

Common update templates:

- `Fuente confirmada`
- `Equipo en camino`
- `Llegó al sitio`
- `Requiere más recursos`
- `Bloqueado por vía`
- `Cerrado / atendido`

Resource templates:

- `Agua 5.000 L`
- `Kits de alimentos`
- `Carpas familiares`
- `Colchonetas`
- `Ambulancia/transporte`
- `Radio VHF`

## SITREP Auto-Summary

Add a guided **Preparar SITREP** action that generates short text for WhatsApp, radio, and email from local data. The user can copy/edit before sharing.

Formats:

- WhatsApp: compact bullet message.
- Radio: short, numbered, no sensitive names.
- Email: slightly fuller subject/body.

Example WhatsApp copy:

`SITREP Colombia - 10:40 p. m.`
`Casos abiertos: 12 | Atender ya: 3 | Sin responsable: 4`
`Prioridades: agua en Cali, albergue en Quibdó, comunicaciones en Chocó.`
`Bloqueos: 1 vía cerrada, 2 recursos pendientes.`
`Compartir solo datos verificados.`

SITREP must always include privacy guardrail copy: `No compartir nombres completos, cédulas, direcciones privadas ni datos médicos.`

## Offline, Local-First, Phone Framing

The UI should be honest that data is stored locally:

- Banner: `Funciona sin cuenta. Los datos quedan guardados en este dispositivo.`
- Offline indicator: `Sin conexión: puedes seguir registrando. Exporta cuando tengas señal.`
- Export reminder: `Haz copia JSON/CSV antes de cambiar de teléfono o navegador.`
- QR/open-on-phone framing: coordinators can display a QR code or copied URL so field users open the guided mode on their own phones.

No feature should imply server sync, live dispatch, or automatic public publication.

## Coordination Mode

Admin complexity stays behind **Modo coordinación**.

Guided mode shows:

- Three action start.
- Role picker.
- Guided intake.
- Crisis feed.
- Suggested assignment.
- SITREP copy.

Coordination mode shows the existing richer modules:

- Operations console.
- Case detail and verification checklist.
- Teams/directory.
- Resources and requests.
- Shelters.
- People check-ins.
- Assignments.
- CSV/JSON export.

Entry copy:

`Modo coordinación: para personas que están verificando, asignando y exportando información operativa.`

Exit copy:

`Volver a modo guiado`

## Implementation Notes

- Add a top-level mode state: `guided` and `coordination`.
- Reuse current localStorage collections and existing case/resource/assignment types.
- Create guided components that write to the same case, volunteer/resource, shelter, assignment, and request records.
- Keep the existing console route/view intact.
- Do not require maps; where location is uncertain, show text references first.
- Use large touch targets, simple Spanish, and one visible decision per screen.
- Keep privacy warnings near people/contact fields and export/SITREP actions.

## Acceptance Criteria

- On mobile width, a first-time user sees the three giant actions without scrolling past dashboard content.
- A non-technical user can submit a need report in under 90 seconds using mostly template buttons.
- A volunteer can register a resource/help offer without seeing the operations console.
- A coordinator can open the crisis feed and identify `Atender ya`, `Necesita verificar`, and `Sin responsable` cases without understanding internal status codes.
- A ready case shows a one-click assignment suggestion based on compatible local team/resource data.
- The app does not depend on a map to find or act on cases.
- SITREP output can be copied as WhatsApp, radio, or email text and includes privacy guardrails.

## QA Review Notes - Guided Response Iteration

Reviewed current uncommitted implementation on phone-sized viewport `390x844`.

### Critical Before Deploy

- Mobile first screen still shows sidebar navigation, Lulo card, topbar, CSV/JSON/Reiniciar controls, and only the top of `Modo guiado`; the three emergency actions begin below the first viewport. This fails the first acceptance criterion and is risky for stressed non-technical users.
- `Tengo recursos / puedo ayudar` is not a guided resource intake. It sends users to existing resource/console/manual-report surfaces, so a volunteer cannot register help without seeing admin-style UI. This fails the volunteer acceptance criterion.
- The guided coordination entry applies the hidden `sin-verificar` filter, so the crisis feed can hide ready-to-assign, assigned, or blocked cases even though the visible chips imply all states are represented.
- `Sugerir equipo` immediately creates an assignment and marks the case assigned without confirmation, and it is allowed on unverified cases. In an emergency this is too easy to mis-dispatch.

### Medium Usability Issues

- Role selection appears before the user chooses an action, adding cognitive load and pushing primary actions down on mobile.
- Need intake starts with location before need type; this can be okay, but it is less natural than asking the urgent need first when someone is stressed.
- Assignment suggestion silently does nothing if no compatible team exists; it should explain that no team is available and offer `Crear solicitud` or `Pedir voluntario`.
- SITREP is one generic copy block, not separate WhatsApp/radio/email formats.
- There is no copy-link/QR/open-on-phone section and no visible offline status beyond local-data copy.
- Plain-language labels improve things, but `Atender ya`, `Atender hoy`, and `Sin responsable` are not fully surfaced as the primary triage language.

### Good

- The guided report wizard is much calmer than the console and uses large touch targets, progress, templates, and privacy reminders.
- Spanish-first copy is direct and field-oriented.
- LocalStorage reuse is intact, and guided reports write into the same case list.
- Lint and production build pass.
- All guided flows continue to work without network after the app has loaded.
- The UI clearly says data is local to the device and export is needed for backup/sharing.
- Existing admin modules remain accessible only behind **Modo coordinación** from the guided experience.
- Touch targets are at least 44px high, labels fit on common mobile widths, and no form requires technical terms like JSON, CSV, coordinates, triage, or localStorage to complete.
- No guided screen asks for cédulas, full private addresses, medical details, or unnecessary full names.

## Fix Pass Resolution - Guided Response Iteration

- Mobile first screen: resolved by placing the three primary actions first and hiding sidebar/topbar controls on the mobile guided home.
- Resource/help flow: resolved with a dedicated guided offer flow for resources and volunteer availability, saving into the same local operational data.
- Crisis feed: resolved by using a full priority-ordered crisis feed instead of a hidden `sin-verificar` filter.
- Assignment safety: resolved by changing `Sugerir equipo` into a visible recommendation that requires explicit confirmation, and confirmation requires a verified case.
- No-team path: resolved with a visible message when no compatible team is available.
- SITREP: resolved with WhatsApp, radio, and email output formats.
- Remaining caveat: QR mode is represented by copy-link/open-on-phone framing; a rendered QR code is still a later enhancement.

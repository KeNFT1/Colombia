import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const storageKeys = {
  casos: 'colombia-relief-router-cases',
  voluntarios: 'colombia-relief-router-teams',
  recursos: 'colombia-relief-router-resources',
  albergues: 'colombia-relief-router-shelters',
  personas: 'colombia-relief-router-people',
  asignaciones: 'colombia-relief-router-assignments',
}

function storedCollection(key: string) {
  return JSON.parse(localStorage.getItem(key) ?? '[]') as Record<string, unknown>[]
}

async function createGuidedNeed(user: ReturnType<typeof userEvent.setup>, municipio = 'Jamundí') {
  render(<App />)

  await user.click(screen.getByRole('button', { name: /reportar ayuda necesaria/i }))
  await user.click(screen.getByRole('button', { name: /vía bloqueada/i }))
  await user.click(screen.getByRole('button', { name: /siguiente/i }))

  await user.type(screen.getByLabelText(/municipio o barrio/i), municipio)
  await user.type(screen.getByLabelText(/departamento/i), 'Valle del Cauca')
  await user.click(screen.getByRole('button', { name: /siguiente/i }))

  await user.clear(screen.getByLabelText(/personas afectadas/i))
  await user.type(screen.getByLabelText(/personas afectadas/i), '12')
  await user.click(screen.getByRole('button', { name: /siguiente/i }))

  await user.click(screen.getByRole('button', { name: /^alta/i }))
  await user.click(screen.getByRole('button', { name: /siguiente/i }))

  await user.type(screen.getByLabelText(/contacto o fuente operativa/i), 'radio local')
  await user.click(screen.getByRole('button', { name: /siguiente/i }))
  await user.click(screen.getByRole('button', { name: /guardar caso/i }))
}

describe('Colombia Relief Router', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows the three primary guided actions on the home view', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /reportar ayuda necesaria/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tengo recursos \/ puedo ayudar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /coordinar casos/i })).toBeInTheDocument()
  })

  it('creates a guided need case and persists it to localStorage', async () => {
    const user = userEvent.setup()

    await createGuidedNeed(user, 'Jamundí')

    const casos = storedCollection(storageKeys.casos)
    expect(casos[0]).toMatchObject({
      id: 'COL-006',
      municipio: 'Jamundí',
      departamento: 'Valle del Cauca',
      necesidad: 'escombros',
      prioridad: 'alta',
      personas: 12,
      contacto: 'radio local',
      estado: 'nuevo',
    })
    expect(screen.getByText(/jamundí · escombros/i)).toBeInTheDocument()
  })

  it('requires verification before confirming a suggested assignment', async () => {
    const user = userEvent.setup()
    await createGuidedNeed(user, 'Jamundí')

    let caseCard = screen.getByText(/jamundí · escombros/i).closest('article')
    expect(caseCard).not.toBeNull()
    await user.click(within(caseCard!).getByRole('button', { name: /sugerir equipo/i }))

    const blockedConfirm = within(caseCard!).getByRole('button', { name: /confirmar asignación/i })
    expect(blockedConfirm).toBeDisabled()
    expect(within(caseCard!).getByText(/verifica este caso antes de asignar/i)).toBeInTheDocument()
    expect(storedCollection(storageKeys.asignaciones).some((item) => item.casoId === 'COL-006')).toBe(false)

    await user.click(within(caseCard!).getByRole('button', { name: /verificado/i }))
    caseCard = screen.getByText(/jamundí · escombros/i).closest('article')
    await waitFor(() => expect(within(caseCard!).getByRole('button', { name: /confirmar asignación/i })).toBeEnabled())
    await user.click(within(caseCard!).getByRole('button', { name: /confirmar asignación/i }))

    expect(storedCollection(storageKeys.asignaciones)[0]).toMatchObject({
      casoId: 'COL-006',
      equipo: 'Cuadrilla eje cafetero',
      estado: 'aceptado',
      eta: '35 min',
    })
    expect(storedCollection(storageKeys.casos)[0]).toMatchObject({
      id: 'COL-006',
      estado: 'asignado',
      responsable: 'Cuadrilla eje cafetero',
    })
  })

  it('registers guided resource and team offers in localStorage', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /tengo recursos \/ puedo ayudar/i }))
    await user.click(screen.getByRole('button', { name: /^agua$/i }))
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.type(screen.getByLabelText(/municipio, barrio o punto de salida/i), 'Bodega Cali')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.clear(screen.getByLabelText(/cantidad o capacidad/i))
    await user.type(screen.getByLabelText(/cantidad o capacidad/i), '800 L')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.type(screen.getByLabelText(/contacto operativo/i), 'mesa logística')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.click(screen.getByRole('button', { name: /registrar ayuda/i }))

    expect(storedCollection(storageKeys.recursos)[0]).toMatchObject({
      nombre: 'Agua potable',
      tipo: 'agua',
      ubicacion: 'Bodega Cali',
      cantidad: '800 L',
      responsable: 'mesa logística',
    })

    await user.click(screen.getByRole('button', { name: /tengo recursos \/ puedo ayudar/i }))
    await user.click(screen.getByRole('button', { name: /manos voluntarias/i }))
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.type(screen.getByLabelText(/municipio, barrio o punto de salida/i), 'Pereira')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.clear(screen.getByLabelText(/cantidad o capacidad/i))
    await user.type(screen.getByLabelText(/cantidad o capacidad/i), '6 personas')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.type(screen.getByLabelText(/contacto operativo/i), 'coordinador turno')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    await user.click(screen.getByRole('button', { name: /registrar ayuda/i }))

    expect(storedCollection(storageKeys.voluntarios)[0]).toMatchObject({
      nombre: 'Voluntarios disponibles',
      base: 'Pereira',
      habilidades: ['alimentos'],
      disponibilidad: '6 personas',
      contacto: 'coordinador turno',
    })
  })

  it('creates admin records and exports JSON with every collection', async () => {
    const user = userEvent.setup()
    let exportedBlob: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      exportedBlob = blob as Blob
      return 'blob:export'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<App />)

    await user.click(screen.getByRole('button', { name: /^recursos$/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Filtros de agua prueba')
    await user.type(screen.getByLabelText(/ubicación/i), 'Cali')
    await user.type(screen.getByLabelText(/cantidad/i), '20 cajas')
    await user.type(screen.getByLabelText(/responsable/i), 'Logística prueba')
    await user.click(screen.getByRole('button', { name: /guardar insumo/i }))

    await user.click(screen.getByRole('button', { name: /directorio/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Equipo prueba')
    await user.type(screen.getByLabelText(/base/i), 'Cali')
    await user.type(screen.getByLabelText(/disponibilidad/i), '4 personas')
    await user.type(screen.getByLabelText(/contacto operativo/i), 'radio equipo')
    await user.click(screen.getByRole('button', { name: /guardar registro/i }))

    await user.click(screen.getByRole('button', { name: /albergues/i }))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Albergue prueba')
    await user.type(screen.getByLabelText(/municipio/i), 'Cali')
    await user.clear(screen.getByLabelText(/capacidad/i))
    await user.type(screen.getByLabelText(/capacidad/i), '80')
    await user.clear(screen.getByLabelText(/ocupación/i))
    await user.type(screen.getByLabelText(/ocupación/i), '10')
    await user.type(screen.getByLabelText(/responsable/i), 'Mesa prueba')
    await user.click(screen.getByRole('button', { name: /guardar albergue/i }))

    await user.click(screen.getByRole('button', { name: /personas/i }))
    await user.type(screen.getByLabelText(/etiqueta segura/i), 'Grupo prueba norte')
    await user.type(screen.getByLabelText(/^municipio$/i), 'Cali')
    await user.type(screen.getByLabelText(/contacto operativo/i), 'enlace prueba')
    await user.type(screen.getByLabelText(/última nota mínima/i), 'Confirmado por enlace operativo, pendiente seguimiento.')
    await user.click(screen.getByLabelText(/confirmo que el registro/i))
    await user.click(screen.getByRole('button', { name: /guardar check-in/i }))

    await user.click(screen.getByRole('button', { name: /^json$/i }))

    expect(exportedBlob).toBeInstanceOf(Blob)
    const exported = JSON.parse(await exportedBlob!.text()) as Record<string, Record<string, unknown>[]>
    expect(Object.keys(exported)).toEqual(expect.arrayContaining(['casos', 'voluntarios', 'recursos', 'albergues', 'personas', 'asignaciones', 'solicitudes', 'exportado']))
    expect(exported.recursos[0]).toMatchObject({ nombre: 'Filtros de agua prueba' })
    expect(exported.voluntarios[0]).toMatchObject({ nombre: 'Equipo prueba' })
    expect(exported.albergues[0]).toMatchObject({ nombre: 'Albergue prueba' })
    expect(exported.personas[0]).toMatchObject({ etiqueta: 'Grupo prueba norte' })
  })
})

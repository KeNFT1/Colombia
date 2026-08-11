import {
  Activity,
  Archive,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileDown,
  HeartPulse,
  Home,
  Languages,
  ListChecks,
  MapPinned,
  PackageCheck,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import './App.css'

type Estado = 'nuevo' | 'verificado' | 'asignado' | 'resuelto'
type Prioridad = 'critica' | 'alta' | 'media' | 'baja'
type Necesidad = 'medica' | 'albergue' | 'agua' | 'alimentos' | 'escombros' | 'transporte' | 'comunicaciones' | 'familia'
type Vista = 'inicio' | 'operaciones' | 'ingreso' | 'recursos' | 'voluntarios' | 'albergues' | 'personas'
type Filtro = 'todas' | 'criticas' | 'sin-verificar' | 'sin-asignar' | 'bloqueadas' | 'riesgo-albergue' | 'brechas' | Necesidad

type Caso = {
  id: string
  municipio: string
  departamento: string
  necesidad: Necesidad
  prioridad: Prioridad
  personas: number
  contacto: string
  coordenadas: string
  notas: string
  estado: Estado
  responsable?: string
  actualizado: string
}

type Voluntario = {
  id: string
  nombre: string
  base: string
  rol: 'coordinador' | 'verificador' | 'voluntario'
  habilidades: Necesidad[]
  disponibilidad: string
  turno: string
  estado: 'disponible' | 'asignado' | 'descanso'
  contacto: string
}

type Recurso = {
  id: string
  nombre: string
  tipo: Necesidad
  ubicacion: string
  cantidad: string
  estado: 'disponible' | 'en ruta' | 'reservado' | 'agotado'
  responsable: string
}

type Albergue = {
  id: string
  nombre: string
  municipio: string
  capacidad: number
  ocupacion: number
  necesidades: Necesidad[]
  estado: 'abierto' | 'casi lleno' | 'lleno'
  responsable: string
}

type Persona = {
  id: string
  etiqueta: string
  municipio: string
  estado: 'sin confirmar' | 'a salvo' | 'requiere ayuda'
  ultimaNota: string
  contacto: string
  actualizado: string
}

type Asignacion = {
  id: string
  casoId: string
  equipo: string
  estado: 'aceptado' | 'en ruta' | 'en sitio' | 'bloqueado' | 'completado'
  eta: string
  responsable: string
  bloqueo?: string
}

type Solicitud = {
  id: string
  casoId: string
  item: string
  cantidad: string
  entregado: string
  punto: string
  estado: 'abierta' | 'comprometida' | 'cubierta'
}

type AsignacionForm = Omit<Asignacion, 'id'> & { bloqueo: string }
type SolicitudForm = Omit<Solicitud, 'id'>

const necesidades: Necesidad[] = ['medica', 'albergue', 'agua', 'alimentos', 'escombros', 'transporte', 'comunicaciones', 'familia']
const estados: Estado[] = ['nuevo', 'verificado', 'asignado', 'resuelto']
const prioridadPeso: Record<Prioridad, number> = { critica: 4, alta: 3, media: 2, baja: 1 }
const prioridadAccion: Record<Estado, number> = { nuevo: 4, verificado: 3, asignado: 2, resuelto: 0 }
const necesidadLabel: Record<Necesidad, string> = {
  medica: 'Salud',
  albergue: 'Albergue',
  agua: 'Agua',
  alimentos: 'Alimentos',
  escombros: 'Escombros',
  transporte: 'Transporte',
  comunicaciones: 'Comunicaciones',
  familia: 'Personas / familia',
}
const prioridadLabel: Record<Prioridad, string> = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const estadoLabel: Record<Estado, string> = { nuevo: 'Nuevo', verificado: 'Verificado', asignado: 'Asignado', resuelto: 'Cerrado' }

const casosBase: Caso[] = [
  {
    id: 'COL-001',
    municipio: 'San José del Palmar',
    departamento: 'Chocó',
    necesidad: 'medica',
    prioridad: 'critica',
    personas: 22,
    contacto: 'enlace local de salud',
    coordenadas: '4.90, -76.23',
    notas: 'Puesto de salud saturado. Se solicitan insumos de trauma, analgesia y traslado.',
    estado: 'verificado',
    responsable: 'Brigada médica occidente',
    actualizado: '10:18 p. m.',
  },
  {
    id: 'COL-002',
    municipio: 'Cali',
    departamento: 'Valle del Cauca',
    necesidad: 'albergue',
    prioridad: 'alta',
    personas: 180,
    contacto: 'mesa de albergue',
    coordenadas: '3.45, -76.53',
    notas: 'Familias durmiendo afuera por daño estructural. Faltan carpas, agua y puntos de carga.',
    estado: 'asignado',
    responsable: 'Celula albergues alfa',
    actualizado: '10:07 p. m.',
  },
  {
    id: 'COL-003',
    municipio: 'Pereira',
    departamento: 'Risaralda',
    necesidad: 'escombros',
    prioridad: 'alta',
    personas: 34,
    contacto: 'bomberos despacho',
    coordenadas: '4.81, -75.69',
    notas: 'Fachada colapsada bloquea vía de acceso a viviendas afectadas.',
    estado: 'nuevo',
    actualizado: '9:58 p. m.',
  },
  {
    id: 'COL-004',
    municipio: 'Quibdó',
    departamento: 'Chocó',
    necesidad: 'comunicaciones',
    prioridad: 'media',
    personas: 75,
    contacto: 'equipo radio local',
    coordenadas: '5.69, -76.66',
    notas: 'Cobertura celular intermitente. Se requieren reportes offline y sincronización posterior.',
    estado: 'verificado',
    actualizado: '9:41 p. m.',
  },
  {
    id: 'COL-005',
    municipio: 'Manizales',
    departamento: 'Caldas',
    necesidad: 'agua',
    prioridad: 'media',
    personas: 96,
    contacto: 'gestión del riesgo municipal',
    coordenadas: '5.07, -75.52',
    notas: 'Punto de distribución de agua para familias en gimnasio escolar.',
    estado: 'asignado',
    responsable: 'Logística norte',
    actualizado: '9:26 p. m.',
  },
]

const voluntariosBase: Voluntario[] = [
  { id: 'EQ-001', nombre: 'Brigada médica occidente', base: 'Cali', rol: 'coordinador', habilidades: ['medica', 'transporte'], disponibilidad: '24 h', turno: 'Noche', estado: 'asignado', contacto: 'radio salud' },
  { id: 'EQ-002', nombre: 'Célula albergues alfa', base: 'Cali', rol: 'coordinador', habilidades: ['albergue', 'alimentos', 'agua'], disponibilidad: '18 personas', turno: 'Mañana', estado: 'asignado', contacto: 'mesa albergues' },
  { id: 'EQ-003', nombre: 'Equipo radio Quibdó', base: 'Quibdó', rol: 'verificador', habilidades: ['comunicaciones'], disponibilidad: '6 kits radio', turno: 'Ahora', estado: 'asignado', contacto: 'canal VHF 3' },
  { id: 'EQ-004', nombre: 'Logística norte', base: 'Manizales', rol: 'voluntario', habilidades: ['agua', 'alimentos', 'transporte'], disponibilidad: '2 camiones', turno: 'Ahora', estado: 'disponible', contacto: 'despacho logístico' },
  { id: 'EQ-005', nombre: 'Cuadrilla eje cafetero', base: 'Pereira', rol: 'voluntario', habilidades: ['escombros', 'albergue'], disponibilidad: 'en espera', turno: 'Madrugada', estado: 'disponible', contacto: 'bomberos despacho' },
]

const recursosBase: Recurso[] = [
  { id: 'INV-001', nombre: 'Kits de trauma', tipo: 'medica', ubicacion: 'Cali', cantidad: '14 cajas', estado: 'en ruta', responsable: 'Coordinación salud' },
  { id: 'INV-002', nombre: 'Agua potable', tipo: 'agua', ubicacion: 'Manizales', cantidad: '5.000 L', estado: 'disponible', responsable: 'Logística norte' },
  { id: 'INV-003', nombre: 'Carpas familiares', tipo: 'albergue', ubicacion: 'Cali', cantidad: '120 uds', estado: 'reservado', responsable: 'Mesa albergues' },
  { id: 'INV-004', nombre: 'Radios VHF', tipo: 'comunicaciones', ubicacion: 'Quibdó', cantidad: '6 kits', estado: 'disponible', responsable: 'Comunicaciones' },
  { id: 'INV-005', nombre: 'Retroexcavadora', tipo: 'escombros', ubicacion: 'Pereira', cantidad: '1 unidad', estado: 'reservado', responsable: 'Bomberos despacho' },
]

const alberguesBase: Albergue[] = [
  { id: 'ALB-001', nombre: 'Gimnasio escolar norte', municipio: 'Manizales', capacidad: 180, ocupacion: 96, necesidades: ['agua', 'alimentos'], estado: 'abierto', responsable: 'Gestión del riesgo municipal' },
  { id: 'ALB-002', nombre: 'Coliseo comunal sur', municipio: 'Cali', capacidad: 420, ocupacion: 311, necesidades: ['albergue', 'agua', 'comunicaciones'], estado: 'casi lleno', responsable: 'Mesa albergues' },
  { id: 'ALB-003', nombre: 'Centro parroquial', municipio: 'Quibdó', capacidad: 95, ocupacion: 54, necesidades: ['alimentos', 'comunicaciones'], estado: 'abierto', responsable: 'Enlace parroquial' },
]

const personasBase: Persona[] = [
  { id: 'PER-001', etiqueta: 'Grupo familiar A', municipio: 'Cali', estado: 'a salvo', ultimaNota: 'Registrado en mesa de albergue.', contacto: 'mesa de albergue', actualizado: '10:02 p. m.' },
  { id: 'PER-002', etiqueta: 'Grupo familiar B', municipio: 'San José del Palmar', estado: 'sin confirmar', ultimaNota: 'Último reporte cerca de plaza central.', contacto: 'enlace comunitario', actualizado: '9:48 p. m.' },
  { id: 'PER-003', etiqueta: 'Lista traslado pacientes', municipio: 'Pereira', estado: 'requiere ayuda', ultimaNota: 'Pendiente confirmación de ambulancia.', contacto: 'bomberos despacho', actualizado: '9:33 p. m.' },
]

const asignacionesBase: Asignacion[] = [
  { id: 'ASG-01', casoId: 'COL-001', equipo: 'Brigada médica occidente', estado: 'en ruta', eta: '35 min', responsable: 'Coordinación salud' },
  { id: 'ASG-02', casoId: 'COL-002', equipo: 'Célula albergues alfa', estado: 'en sitio', eta: '0 min', responsable: 'Mesa albergues' },
  { id: 'ASG-03', casoId: 'COL-004', equipo: 'Equipo radio Quibdó', estado: 'aceptado', eta: '50 min', responsable: 'Comunicaciones' },
]

const solicitudesBase: Solicitud[] = [
  { id: 'REQ-01', casoId: 'COL-001', item: 'Kits de trauma', cantidad: '20', entregado: '14', punto: 'Hospital local', estado: 'comprometida' },
  { id: 'REQ-02', casoId: 'COL-002', item: 'Carpas familiares', cantidad: '160', entregado: '120', punto: 'Coliseo comunal sur', estado: 'abierta' },
  { id: 'REQ-03', casoId: 'COL-005', item: 'Agua potable', cantidad: '5.000 L', entregado: '5.000 L', punto: 'Gimnasio escolar norte', estado: 'cubierta' },
]

function leerColeccion<T>(clave: string, base: T[]) {
  const guardado = localStorage.getItem(clave)
  if (!guardado) return base
  try {
    return JSON.parse(guardado) as T[]
  } catch {
    return base
  }
}

function guardarColeccion<T>(clave: string, registros: T[]) {
  localStorage.setItem(clave, JSON.stringify(registros))
}

const claves = {
  casos: 'colombia-relief-router-cases',
  voluntarios: 'colombia-relief-router-teams',
  recursos: 'colombia-relief-router-resources',
  albergues: 'colombia-relief-router-shelters',
  personas: 'colombia-relief-router-people',
  asignaciones: 'colombia-relief-router-assignments',
  solicitudes: 'colombia-relief-router-requests',
}

const horaCorta = () => new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

function siguienteId(prefijo: string, existentes: { id: string }[]) {
  return `${prefijo}-${String(existentes.length + 1).padStart(3, '0')}`
}

function App() {
  const [vista, setVista] = useState<Vista>('inicio')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [casos, setCasos] = useState<Caso[]>(() => leerColeccion(claves.casos, casosBase))
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>(() => leerColeccion(claves.voluntarios, voluntariosBase))
  const [recursos, setRecursos] = useState<Recurso[]>(() => leerColeccion(claves.recursos, recursosBase))
  const [albergues, setAlbergues] = useState<Albergue[]>(() => leerColeccion(claves.albergues, alberguesBase))
  const [personas, setPersonas] = useState<Persona[]>(() => leerColeccion(claves.personas, personasBase))
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(() => leerColeccion(claves.asignaciones, asignacionesBase))
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() => leerColeccion(claves.solicitudes, solicitudesBase))
  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState('')
  const [formulario, setFormulario] = useState({
    municipio: '',
    departamento: '',
    necesidad: 'medica' as Necesidad,
    prioridad: 'media' as Prioridad,
    personas: 1,
    contacto: '',
    coordenadas: '',
    notas: '',
  })
  const [nuevoVoluntario, setNuevoVoluntario] = useState({
    nombre: '',
    base: '',
    rol: 'voluntario' as Voluntario['rol'],
    habilidades: ['agua'] as Necesidad[],
    disponibilidad: '',
    turno: 'Ahora',
    estado: 'disponible' as Voluntario['estado'],
    contacto: '',
  })
  const [nuevoRecurso, setNuevoRecurso] = useState({
    nombre: '',
    tipo: 'agua' as Necesidad,
    ubicacion: '',
    cantidad: '',
    estado: 'disponible' as Recurso['estado'],
    responsable: '',
  })
  const [nuevoAlbergue, setNuevoAlbergue] = useState({
    nombre: '',
    municipio: '',
    capacidad: 50,
    ocupacion: 0,
    necesidades: ['agua'] as Necesidad[],
    estado: 'abierto' as Albergue['estado'],
    responsable: '',
  })
  const [nuevaPersona, setNuevaPersona] = useState({
    etiqueta: '',
    municipio: '',
    estado: 'sin confirmar' as Persona['estado'],
    ultimaNota: '',
    contacto: '',
  })
  const [privacidadPersonaOk, setPrivacidadPersonaOk] = useState(false)
  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    casoId: '',
    equipo: '',
    estado: 'aceptado' as Asignacion['estado'],
    eta: '30 min',
    responsable: '',
    bloqueo: '',
  })
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    casoId: '',
    item: '',
    cantidad: '',
    entregado: '0',
    punto: '',
    estado: 'abierta' as Solicitud['estado'],
  })

  const abiertos = casos.filter((caso) => caso.estado !== 'resuelto')
  const asignacionesBloqueadas = asignaciones.filter((item) => item.estado === 'bloqueado')
  const alberguesEnRiesgo = albergues.filter((albergue) => albergue.estado !== 'lleno' && albergue.ocupacion / Math.max(albergue.capacidad, 1) >= 0.8)
  const casoSeleccionado = casos.find((caso) => caso.id === casoSeleccionadoId) ?? null
  const solicitudesAbiertas = solicitudes.filter((item) => item.estado !== 'cubierta')
  const filtrados = useMemo(() => {
    return casos
      .filter((caso) => {
        if (filtro === 'todas') return true
        if (filtro === 'criticas') return caso.prioridad === 'critica'
        if (filtro === 'sin-verificar') return caso.estado === 'nuevo'
        if (filtro === 'sin-asignar') return caso.estado === 'nuevo' || caso.estado === 'verificado'
        if (filtro === 'bloqueadas') return asignacionesBloqueadas.some((item) => item.casoId === caso.id)
        if (filtro === 'riesgo-albergue') return caso.necesidad === 'albergue' && alberguesEnRiesgo.length > 0
        if (filtro === 'brechas') return solicitudesAbiertas.some((item) => item.casoId === caso.id)
        return caso.necesidad === filtro
      })
      .filter((caso) => `${caso.municipio} ${caso.departamento} ${caso.notas}`.toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => (prioridadPeso[b.prioridad] + prioridadAccion[b.estado]) - (prioridadPeso[a.prioridad] + prioridadAccion[a.estado]))
  }, [alberguesEnRiesgo.length, asignacionesBloqueadas, busqueda, casos, filtro, solicitudesAbiertas])

  const brechas = necesidades.map((necesidad) => {
    const demanda = abiertos.filter((caso) => caso.necesidad === necesidad).length
    const oferta = voluntarios.filter((voluntario) => voluntario.habilidades.includes(necesidad)).length + recursos.filter((recurso) => recurso.tipo === necesidad).length
    return { necesidad, demanda, oferta, brecha: Math.max(demanda - oferta, 0) }
  })
  const brechasActivas = brechas.filter((item) => item.brecha > 0)

  const casoMasUrgente = filtrados.find((caso) => caso.estado !== 'resuelto')
  const casoActivo = casoSeleccionado ?? casoMasUrgente ?? abiertos[0] ?? null
  const equiposSugeridos = casoActivo
    ? voluntarios
        .filter((equipo) => equipo.habilidades.includes(casoActivo.necesidad))
        .sort((a, b) => (a.estado === 'disponible' ? -1 : 1) - (b.estado === 'disponible' ? -1 : 1))
        .slice(0, 3)
    : []
  const recursosSugeridos = casoActivo ? recursos.filter((recurso) => recurso.tipo === casoActivo.necesidad && recurso.estado !== 'agotado').slice(0, 3) : []
  const alberguesSugeridos = casoActivo
    ? albergues
        .filter((albergue) => albergue.ocupacion < albergue.capacidad && (casoActivo.necesidad === 'albergue' || albergue.municipio === casoActivo.municipio))
        .slice(0, 3)
    : []
  const riesgos = {
    criticos: abiertos.filter((caso) => caso.prioridad === 'critica').length,
    sinVerificar: abiertos.filter((caso) => caso.estado === 'nuevo').length,
    verificadosSinAsignar: abiertos.filter((caso) => caso.estado === 'verificado').length,
    bloqueadas: asignacionesBloqueadas.length,
    albergue: alberguesEnRiesgo.length,
    brechas: brechasActivas.length + solicitudesAbiertas.length,
  }

  function agregarCaso(evento: FormEvent) {
    evento.preventDefault()
    const nuevo: Caso = {
      id: `COL-${String(casos.length + 1).padStart(3, '0')}`,
      ...formulario,
      personas: Number(formulario.personas),
      estado: 'nuevo',
      actualizado: horaCorta(),
    }
    const actualizados = [nuevo, ...casos]
    setCasos(actualizados)
    guardarColeccion(claves.casos, actualizados)
    setCasoSeleccionadoId(nuevo.id)
    setFormulario({ ...formulario, municipio: '', departamento: '', personas: 1, contacto: '', coordenadas: '', notas: '' })
    setVista('operaciones')
  }

  function cambiarEstado(id: string, estado: Estado) {
    const actualizados = casos.map((caso) =>
      caso.id === id
        ? { ...caso, estado, actualizado: horaCorta() }
        : caso,
    )
    setCasos(actualizados)
    guardarColeccion(claves.casos, actualizados)
  }

  function seleccionarCaso(caso: Caso) {
    setCasoSeleccionadoId(caso.id)
    const equipo = voluntarios.find((item) => item.habilidades.includes(caso.necesidad) && item.estado === 'disponible') ?? voluntarios.find((item) => item.habilidades.includes(caso.necesidad))
    const recurso = recursos.find((item) => item.tipo === caso.necesidad && item.estado !== 'agotado')
    const albergue = albergues.find((item) => item.ocupacion < item.capacidad && (caso.necesidad === 'albergue' || item.municipio === caso.municipio))
    setNuevaAsignacion({
      casoId: caso.id,
      equipo: equipo?.nombre ?? '',
      estado: 'aceptado',
      eta: caso.prioridad === 'critica' ? '20 min' : '45 min',
      responsable: equipo?.contacto ?? caso.contacto,
      bloqueo: '',
    })
    setNuevaSolicitud({
      casoId: caso.id,
      item: recurso?.nombre ?? (caso.necesidad === 'albergue' ? 'Cupos de albergue' : necesidadLabel[caso.necesidad]),
      cantidad: caso.necesidad === 'albergue' ? String(caso.personas) : '',
      entregado: '0',
      punto: albergue?.nombre ?? caso.municipio,
      estado: 'abierta',
    })
  }

  function guardarCasos(actualizados: Caso[]) {
    setCasos(actualizados)
    guardarColeccion(claves.casos, actualizados)
  }

  function agregarVoluntario(evento: FormEvent) {
    evento.preventDefault()
    const actualizados = [{ id: siguienteId('EQ', voluntarios), ...nuevoVoluntario }, ...voluntarios]
    setVoluntarios(actualizados)
    guardarColeccion(claves.voluntarios, actualizados)
    setNuevoVoluntario({ ...nuevoVoluntario, nombre: '', base: '', disponibilidad: '', contacto: '' })
  }

  function actualizarVoluntario(id: string, cambios: Partial<Voluntario>) {
    const actualizados = voluntarios.map((item) => item.id === id ? { ...item, ...cambios } : item)
    setVoluntarios(actualizados)
    guardarColeccion(claves.voluntarios, actualizados)
  }

  function agregarRecurso(evento: FormEvent) {
    evento.preventDefault()
    const actualizados = [{ id: siguienteId('INV', recursos), ...nuevoRecurso }, ...recursos]
    setRecursos(actualizados)
    guardarColeccion(claves.recursos, actualizados)
    setNuevoRecurso({ ...nuevoRecurso, nombre: '', ubicacion: '', cantidad: '', responsable: '' })
  }

  function actualizarRecurso(id: string, cambios: Partial<Recurso>) {
    const actualizados = recursos.map((item) => item.id === id ? { ...item, ...cambios } : item)
    setRecursos(actualizados)
    guardarColeccion(claves.recursos, actualizados)
  }

  function agregarAlbergue(evento: FormEvent) {
    evento.preventDefault()
    const ocupacion = Math.min(Number(nuevoAlbergue.ocupacion), Number(nuevoAlbergue.capacidad))
    const actualizados = [{ id: siguienteId('ALB', albergues), ...nuevoAlbergue, capacidad: Number(nuevoAlbergue.capacidad), ocupacion }, ...albergues]
    setAlbergues(actualizados)
    guardarColeccion(claves.albergues, actualizados)
    setNuevoAlbergue({ ...nuevoAlbergue, nombre: '', municipio: '', capacidad: 50, ocupacion: 0, responsable: '' })
  }

  function actualizarAlbergue(id: string, cambios: Partial<Albergue>) {
    const actualizados = albergues.map((item) => item.id === id ? { ...item, ...cambios } : item)
    setAlbergues(actualizados)
    guardarColeccion(claves.albergues, actualizados)
  }

  function agregarPersona(evento: FormEvent) {
    evento.preventDefault()
    const actualizados = [{ id: siguienteId('PER', personas), ...nuevaPersona, actualizado: horaCorta() }, ...personas]
    setPersonas(actualizados)
    guardarColeccion(claves.personas, actualizados)
    setNuevaPersona({ ...nuevaPersona, etiqueta: '', municipio: '', ultimaNota: '', contacto: '' })
    setPrivacidadPersonaOk(false)
  }

  function actualizarPersona(id: string, cambios: Partial<Persona>) {
    const actualizados = personas.map((item) => item.id === id ? { ...item, ...cambios, actualizado: horaCorta() } : item)
    setPersonas(actualizados)
    guardarColeccion(claves.personas, actualizados)
  }

  function agregarAsignacion(evento: FormEvent) {
    evento.preventDefault()
    const equipo = nuevaAsignacion.equipo || voluntarios[0]?.nombre || 'Equipo pendiente'
    const casoId = nuevaAsignacion.casoId || abiertos[0]?.id || ''
    if (!casoId) return
    const actualizados = [{ id: siguienteId('ASG', asignaciones), ...nuevaAsignacion, casoId, equipo }, ...asignaciones]
    setAsignaciones(actualizados)
    guardarColeccion(claves.asignaciones, actualizados)
    guardarCasos(casos.map((caso) => caso.id === casoId ? { ...caso, estado: 'asignado', responsable: equipo, actualizado: horaCorta() } : caso))
    setNuevaAsignacion({ ...nuevaAsignacion, casoId: '', equipo: '', eta: '30 min', responsable: '', bloqueo: '' })
  }

  function actualizarAsignacion(id: string, cambios: Partial<Asignacion>) {
    const actualizados = asignaciones.map((item) => item.id === id ? { ...item, ...cambios } : item)
    setAsignaciones(actualizados)
    guardarColeccion(claves.asignaciones, actualizados)
  }

  function agregarSolicitud(evento: FormEvent) {
    evento.preventDefault()
    const casoId = nuevaSolicitud.casoId || casoActivo?.id || ''
    if (!casoId) return
    const actualizados = [{ id: siguienteId('REQ', solicitudes), ...nuevaSolicitud, casoId }, ...solicitudes]
    setSolicitudes(actualizados)
    guardarColeccion(claves.solicitudes, actualizados)
    setNuevaSolicitud({ ...nuevaSolicitud, casoId: '', item: '', cantidad: '', entregado: '0', punto: '', estado: 'abierta' })
  }

  function actualizarSolicitud(id: string, cambios: Partial<Solicitud>) {
    const actualizados = solicitudes.map((item) => item.id === id ? { ...item, ...cambios } : item)
    setSolicitudes(actualizados)
    guardarColeccion(claves.solicitudes, actualizados)
  }

  function exportar(tipo: 'json' | 'csv') {
    const csv = (filas: (string | number | undefined)[][]) => filas.map((fila) => fila.map((valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const contenido =
      tipo === 'json'
        ? JSON.stringify({ casos, voluntarios, recursos, albergues, personas, asignaciones, solicitudes, exportado: new Date().toISOString() }, null, 2)
        : [
            '# casos',
            csv([
              ['id', 'municipio', 'departamento', 'necesidad', 'prioridad', 'personas', 'contacto', 'coordenadas', 'estado', 'responsable', 'actualizado', 'notas'],
              ...casos.map((caso) =>
              [
                caso.id,
                caso.municipio,
                caso.departamento,
                caso.necesidad,
                caso.prioridad,
                caso.personas,
                caso.contacto,
                caso.coordenadas,
                caso.estado,
                caso.responsable ?? '',
                caso.actualizado,
                caso.notas,
              ]),
            ]),
            '',
            '# asignaciones',
            csv([
              ['id', 'casoId', 'equipo', 'estado', 'eta', 'responsable', 'bloqueo'],
              ...asignaciones.map((item) => [item.id, item.casoId, item.equipo, item.estado, item.eta, item.responsable, item.bloqueo]),
            ]),
            '',
            '# solicitudes',
            csv([
              ['id', 'casoId', 'item', 'cantidad', 'entregado', 'punto', 'estado'],
              ...solicitudes.map((item) => [item.id, item.casoId, item.item, item.cantidad, item.entregado, item.punto, item.estado]),
            ]),
          ].join('\n')
    const blob = new Blob([contenido], { type: tipo === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `ruta-ayuda-colombia.${tipo}`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  function restaurar() {
    setCasos(casosBase)
    setVoluntarios(voluntariosBase)
    setRecursos(recursosBase)
    setAlbergues(alberguesBase)
    setPersonas(personasBase)
    setAsignaciones(asignacionesBase)
    setSolicitudes(solicitudesBase)
    guardarColeccion(claves.casos, casosBase)
    guardarColeccion(claves.voluntarios, voluntariosBase)
    guardarColeccion(claves.recursos, recursosBase)
    guardarColeccion(claves.albergues, alberguesBase)
    guardarColeccion(claves.personas, personasBase)
    guardarColeccion(claves.asignaciones, asignacionesBase)
    guardarColeccion(claves.solicitudes, solicitudesBase)
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand-mark">
          <span>RC</span>
          <div>
            <strong>Ruta Colombia</strong>
            <small>Mesa de coordinación</small>
          </div>
        </div>
        <nav>
          <NavButton active={vista === 'inicio'} icon={<Home />} label="Inicio" onClick={() => setVista('inicio')} />
          <NavButton active={vista === 'operaciones'} icon={<Activity />} label="Operaciones" onClick={() => setVista('operaciones')} />
          <NavButton active={vista === 'ingreso'} icon={<ClipboardCheck />} label="Ingreso" onClick={() => setVista('ingreso')} />
          <NavButton active={vista === 'recursos'} icon={<PackageCheck />} label="Recursos" onClick={() => setVista('recursos')} />
          <NavButton active={vista === 'voluntarios'} icon={<Users />} label="Directorio" onClick={() => setVista('voluntarios')} />
          <NavButton active={vista === 'albergues'} icon={<Warehouse />} label="Albergues" onClick={() => setVista('albergues')} />
          <NavButton active={vista === 'personas'} icon={<ShieldCheck />} label="Personas" onClick={() => setVista('personas')} />
        </nav>
        <div className="sidebar-note">
          <Bell size={16} />
          <span>Datos locales. Exporta solo información verificada.</span>
        </div>
        <div className="lulo-credit" aria-label="Construido por Lulo Studios">
          <span className="lulo-orb">L</span>
          <div>
            <strong>Lulo Studios</strong>
            <small>Herramientas útiles para respuesta pública.</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow"><Radio size={16} /> Respuesta sísmica · Colombia</p>
            <h1>Mesa de Respuesta - Sismo Colombia</h1>
            <p>Registra reportes, prioriza casos y coordina equipos locales.</p>
          </div>
          <div className="topbar-tools">
            <span className="studio-chip">Lulo Studios · utilidad pública</span>
            <div className="actions">
              <button onClick={() => exportar('csv')} title="Descargar casos en CSV"><FileDown size={18} /> CSV</button>
              <button onClick={() => exportar('json')} title="Descargar paquete JSON"><Download size={18} /> JSON</button>
              <button className="quiet" onClick={restaurar} title="Restaurar datos de ejemplo"><Languages size={18} /> Reiniciar</button>
            </div>
          </div>
        </header>

        {vista === 'inicio' && (
          <section className="landing">
            <div className="landing-copy">
              <p className="eyebrow"><Sparkles size={16} /> Diseñado para claridad en crisis</p>
              <h2>De reporte suelto a acción coordinada en cuatro pasos.</h2>
              <p>
                La herramienta organiza información de campo sin depender de cuentas externas: registra, verifica, asigna
                y exporta. Está pensada para coordinadores, voluntarios y enlaces locales que necesitan decidir rápido sin
                exponer datos sensibles.
              </p>
              <div className="trust-strip">Datos guardados en este dispositivo · No publicar datos sensibles · Exportable CSV/JSON</div>
              <div className="step-row">
                <Step n="1" title="Registrar" text="Captura municipio, prioridad, necesidad, personas afectadas y contacto." />
                <Step n="2" title="Verificar" text="Filtra reportes, confirma origen y mueve el caso a verificado." />
                <Step n="3" title="Asignar" text="Cruza brechas con voluntarios, recursos, albergues y transporte." />
                <Step n="4" title="Compartir" text="Exporta CSV o JSON para hojas de cálculo, agencias o radio-operadores." />
              </div>
              <button className="primary wide" onClick={() => setVista('operaciones')}>Abrir consola operativa</button>
            </div>
            <div className="system-card">
              <div className="signal-line"><span /> Prioridad actual</div>
              <strong>{casoMasUrgente?.municipio ?? 'Sin casos abiertos'}</strong>
              <p>{casoMasUrgente?.notas ?? 'Cuando ingrese un caso, aparecerá aquí.'}</p>
              <div className="mini-map">
                {casos.slice(0, 5).map((caso, index) => <i key={caso.id} style={{ left: `${18 + index * 15}%`, top: `${30 + (index % 3) * 17}%` }} />)}
              </div>
            </div>
          </section>
        )}

        {vista === 'operaciones' && (
          <>
            <Riesgos riesgos={riesgos} setFiltro={setFiltro} />
            <section className="console-grid">
              <div className="panel queue-panel">
                <div className="panel-header">
                  <h2><ListChecks size={19} /> Cola de triage</h2>
                  <label className="search"><Search size={16} /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar municipio, nota o departamento" /></label>
                </div>
                <div className="chips">
                  <button className={filtro === 'todas' ? 'active' : ''} onClick={() => setFiltro('todas')}>Todos</button>
                  <button className={filtro === 'criticas' ? 'active' : ''} onClick={() => setFiltro('criticas')}>Críticos</button>
                  <button className={filtro === 'sin-verificar' ? 'active' : ''} onClick={() => setFiltro('sin-verificar')}>Sin verificar</button>
                  <button className={filtro === 'sin-asignar' ? 'active' : ''} onClick={() => setFiltro('sin-asignar')}>Sin asignar</button>
                  <button className={filtro === 'bloqueadas' ? 'active' : ''} onClick={() => setFiltro('bloqueadas')}>Bloqueadas</button>
                  <button className={filtro === 'riesgo-albergue' ? 'active' : ''} onClick={() => setFiltro('riesgo-albergue')}>Riesgo albergue</button>
                  <button className={filtro === 'brechas' ? 'active' : ''} onClick={() => setFiltro('brechas')}>Brechas</button>
                  {necesidades.map((necesidad) => <button key={necesidad} className={filtro === necesidad ? 'active' : ''} onClick={() => setFiltro(necesidad)}>{necesidadLabel[necesidad]}</button>)}
                </div>
                <div className="case-list">
                  {filtrados.length ? filtrados.map((caso) => (
                    <CasoFila
                      key={caso.id}
                      caso={caso}
                      activo={casoActivo?.id === caso.id}
                      onEstado={cambiarEstado}
                      onSeleccionar={seleccionarCaso}
                    />
                  )) : <Empty text="No hay casos con este filtro." />}
                </div>
              </div>
              <CasoDetalle
                caso={casoActivo}
                asignaciones={asignaciones}
                solicitudes={solicitudes}
                equipos={equiposSugeridos}
                recursos={recursosSugeridos}
                albergues={alberguesSugeridos}
                onEstado={cambiarEstado}
                onAsignar={(caso) => {
                  seleccionarCaso(caso)
                  setNuevaAsignacion((actual) => ({ ...actual, casoId: caso.id }))
                }}
              />
            </section>
            <section className="support-grid">
              <Assignments
                asignaciones={asignaciones}
                solicitudes={solicitudes}
                casos={abiertos}
                voluntarios={voluntarios}
                casoActivo={casoActivo}
                formulario={nuevaAsignacion}
                setFormulario={setNuevaAsignacion}
                agregarAsignacion={agregarAsignacion}
                actualizarAsignacion={actualizarAsignacion}
                solicitudFormulario={nuevaSolicitud}
                setSolicitudFormulario={setNuevaSolicitud}
                agregarSolicitud={agregarSolicitud}
                actualizarSolicitud={actualizarSolicitud}
              />
              <Sitrep casos={casos} />
            </section>
          </>
        )}

        {vista === 'ingreso' && <Ingreso formulario={formulario} setFormulario={setFormulario} agregarCaso={agregarCaso} />}
        {vista === 'recursos' && <Recursos brechas={brechas} recursos={recursos} formulario={nuevoRecurso} setFormulario={setNuevoRecurso} agregarRecurso={agregarRecurso} actualizarRecurso={actualizarRecurso} />}
        {vista === 'voluntarios' && <Voluntarios voluntarios={voluntarios} casos={abiertos} formulario={nuevoVoluntario} setFormulario={setNuevoVoluntario} agregarVoluntario={agregarVoluntario} actualizarVoluntario={actualizarVoluntario} />}
        {vista === 'albergues' && <Albergues albergues={albergues} formulario={nuevoAlbergue} setFormulario={setNuevoAlbergue} agregarAlbergue={agregarAlbergue} actualizarAlbergue={actualizarAlbergue} />}
        {vista === 'personas' && <Personas personas={personas} formulario={nuevaPersona} setFormulario={setNuevaPersona} agregarPersona={agregarPersona} actualizarPersona={actualizarPersona} privacidadOk={privacidadPersonaOk} setPrivacidadOk={setPrivacidadPersonaOk} />}
      </section>
    </main>
  )
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={active ? 'nav active' : 'nav'} onClick={onClick}>{icon}<span>{label}</span></button>
}

function Riesgos({ riesgos, setFiltro }: { riesgos: { criticos: number; sinVerificar: number; verificadosSinAsignar: number; bloqueadas: number; albergue: number; brechas: number }; setFiltro: (filtro: Filtro) => void }) {
  return (
    <section className="risk-band" aria-label="Riesgos operativos">
      <RiskTile icon={<HeartPulse />} label="Críticos" value={riesgos.criticos} tone="critical" onClick={() => setFiltro('criticas')} />
      <RiskTile icon={<ShieldCheck />} label="Sin verificar" value={riesgos.sinVerificar} tone="warn" onClick={() => setFiltro('sin-verificar')} />
      <RiskTile icon={<Route />} label="Verificados sin asignar" value={riesgos.verificadosSinAsignar} tone="warn" onClick={() => setFiltro('sin-asignar')} />
      <RiskTile icon={<Truck />} label="Asignaciones bloqueadas" value={riesgos.bloqueadas} tone="blocked" onClick={() => setFiltro('bloqueadas')} />
      <RiskTile icon={<Warehouse />} label="Albergues en riesgo" value={riesgos.albergue} tone="warn" onClick={() => setFiltro('riesgo-albergue')} />
      <RiskTile icon={<PackageCheck />} label="Brechas / solicitudes" value={riesgos.brechas} tone="warn" onClick={() => setFiltro('brechas')} />
    </section>
  )
}

function RiskTile({ icon, label, value, tone, onClick }: { icon: ReactNode; label: string; value: number; tone: 'critical' | 'warn' | 'blocked'; onClick: () => void }) {
  return <button className={`risk-tile ${tone}`} onClick={onClick}>{icon}<span>{label}</span><strong>{value}</strong></button>
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return <article><span>{n}</span><strong>{title}</strong><p>{text}</p></article>
}

function CasoFila({ caso, activo, onEstado, onSeleccionar }: { caso: Caso; activo: boolean; onEstado: (id: string, estado: Estado) => void; onSeleccionar: (caso: Caso) => void }) {
  return (
    <article className={`case-row ${caso.prioridad} ${activo ? 'selected' : ''}`}>
      <button className="case-main" type="button" onClick={() => onSeleccionar(caso)}>
        <div className="row-title"><strong>{caso.id}</strong><span>{caso.municipio}, {caso.departamento}</span></div>
        <p>{caso.notas}</p>
        <div className="meta">
          <span>{necesidadLabel[caso.necesidad]}</span><span>{prioridadLabel[caso.prioridad]}</span><span>{caso.personas} personas</span><span>{caso.coordenadas || 'sin coordenadas'}</span>
        </div>
      </button>
      <div className="status-box">
        <select value={caso.estado} onChange={(e) => onEstado(caso.id, e.target.value as Estado)}>
          {estados.map((estado) => <option key={estado} value={estado}>{estadoLabel[estado]}</option>)}
        </select>
        <small>{caso.actualizado}</small>
      </div>
    </article>
  )
}

function CasoDetalle({ caso, asignaciones, solicitudes, equipos, recursos, albergues, onEstado, onAsignar }: {
  caso: Caso | null
  asignaciones: Asignacion[]
  solicitudes: Solicitud[]
  equipos: Voluntario[]
  recursos: Recurso[]
  albergues: Albergue[]
  onEstado: (id: string, estado: Estado) => void
  onAsignar: (caso: Caso) => void
}) {
  if (!caso) {
    return <section className="panel"><Empty text="Selecciona un caso para ver verificación, sugerencias y acciones." /></section>
  }
  const asignacionCaso = asignaciones.find((item) => item.casoId === caso.id)
  const solicitudesCaso = solicitudes.filter((item) => item.casoId === caso.id)
  return (
    <section className="panel detail-panel">
      <div className="detail-head">
        <div>
          <h2><Route size={19} /> Caso seleccionado</h2>
          <strong>{caso.id} · {caso.municipio}</strong>
          <p>{necesidadLabel[caso.necesidad]} · {prioridadLabel[caso.prioridad]} · {caso.personas} personas</p>
        </div>
        <span className={`status-pill ${caso.estado}`}>{estadoLabel[caso.estado]}</span>
      </div>

      <div className="next-action">
        <strong>Siguiente acción</strong>
        <p>{caso.estado === 'nuevo' ? 'Confirmar fuente, hora, ubicación y alcance antes de asignar.' : caso.estado === 'verificado' ? 'Asignar equipo compatible y abrir solicitud de insumo si falta cobertura.' : asignacionCaso?.estado === 'bloqueado' ? 'Resolver bloqueo operativo antes de mover ETA.' : 'Dar seguimiento a ETA, evidencia de atención y cierre.'}</p>
      </div>

      <h2><ShieldCheck size={19} /> Lista de verificación</h2>
      <div className="verification-list">
        <CheckItem listo={Boolean(caso.contacto)} texto="Contacto operativo o fuente local registrada" />
        <CheckItem listo={Boolean(caso.notas && caso.notas.length > 20)} texto="Necesidad, alcance y evidencia mínima descritos" />
        <CheckItem listo={Boolean(caso.coordenadas || caso.municipio)} texto="Ubicación accionable para despacho" />
        <CheckItem listo={caso.estado !== 'nuevo'} texto="Revisión completada antes de exportar o asignar públicamente" />
      </div>

      <h2><Sparkles size={19} /> Sugerencias</h2>
      <div className="suggestions">
        <MiniRow title="Equipo" body={equipos.map((item) => `${item.nombre} (${item.estado})`).join(', ') || 'Sin equipo compatible disponible'} status="matching" />
        <MiniRow title="Recurso" body={recursos.map((item) => `${item.nombre} · ${item.cantidad}`).join(', ') || 'Crear solicitud de insumo'} status="inventario" />
        <MiniRow title="Albergue" body={albergues.map((item) => `${item.nombre} · ${item.capacidad - item.ocupacion} cupos`).join(', ') || 'Sin cupos sugeridos'} status="capacidad" />
      </div>

      <div className="quick-actions">
        <button onClick={() => onEstado(caso.id, 'verificado')} disabled={caso.estado !== 'nuevo'}><CheckCircle2 size={17} /> Marcar verificado</button>
        <button className="primary" onClick={() => onAsignar(caso)}><Truck size={17} /> Preparar asignación</button>
      </div>

      <h2><PackageCheck size={19} /> Solicitudes del caso</h2>
      <div className="stack tight">
        {solicitudesCaso.length ? solicitudesCaso.map((item) => <article key={item.id}><strong>{item.item}</strong><p>{item.entregado}/{item.cantidad} · {item.punto}</p><span className="pill">{item.estado}</span></article>) : <Empty text="No hay solicitudes registradas para este caso." />}
      </div>

      <h2><MapPinned size={19} /> Vista territorial</h2>
      <div className="map-board">
        <button className={`pin ${caso.prioridad}`} style={{ left: '48%', top: '44%' }} title={`${caso.municipio}: ${caso.necesidad}`} />
      </div>
    </section>
  )
}

function CheckItem({ listo, texto }: { listo: boolean; texto: string }) {
  return <div className={listo ? 'check-item done' : 'check-item'}><CheckCircle2 size={16} /><span>{texto}</span></div>
}

function Ingreso({ formulario, setFormulario, agregarCaso }: {
  formulario: {
    municipio: string
    departamento: string
    necesidad: Necesidad
    prioridad: Prioridad
    personas: number
    contacto: string
    coordenadas: string
    notas: string
  }
  setFormulario: (valor: typeof formulario) => void
  agregarCaso: (evento: FormEvent) => void
}) {
  return (
    <section className="panel focused">
      <h2><ClipboardCheck size={19} /> Registrar reporte</h2>
      <p className="helper">Usa solo datos necesarios para coordinar ayuda. Evita cédulas, historias clínicas o datos privados.</p>
      <form onSubmit={agregarCaso}>
        <div className="form-grid">
          <label>Municipio<input value={formulario.municipio} onChange={(e) => setFormulario({ ...formulario, municipio: e.target.value })} required /></label>
          <label>Departamento<input value={formulario.departamento} onChange={(e) => setFormulario({ ...formulario, departamento: e.target.value })} required /></label>
          <label>Necesidad<select value={formulario.necesidad} onChange={(e) => setFormulario({ ...formulario, necesidad: e.target.value as Necesidad })}>{necesidades.map((item) => <option key={item} value={item}>{necesidadLabel[item]}</option>)}</select></label>
          <label>Prioridad<select value={formulario.prioridad} onChange={(e) => setFormulario({ ...formulario, prioridad: e.target.value as Prioridad })}><option value="critica">Crítica</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></label>
          <label>Personas afectadas<input type="number" min="1" value={formulario.personas} onChange={(e) => setFormulario({ ...formulario, personas: Number(e.target.value) })} /></label>
          <label>Coordenadas<input value={formulario.coordenadas} onChange={(e) => setFormulario({ ...formulario, coordenadas: e.target.value })} placeholder="Opcional; usa municipio si no hay GPS" /></label>
        </div>
        <label>Contacto operativo<input value={formulario.contacto} onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })} placeholder="Ej. enlace comunitario, PMU municipal, Cruz Roja local" /></label>
        <label>Notas verificables<textarea rows={5} value={formulario.notas} onChange={(e) => setFormulario({ ...formulario, notas: e.target.value })} placeholder="Qué pasó, cuántas personas, qué se necesita, fuente del reporte" required /></label>
        <button className="primary wide" type="submit">Guardar y enviar a triage</button>
      </form>
    </section>
  )
}

function SelectorNecesidades({ value, onChange }: { value: Necesidad[]; onChange: (value: Necesidad[]) => void }) {
  return (
    <div className="check-grid">
      {necesidades.map((necesidad) => (
        <label key={necesidad} className="check-row">
          <input
            type="checkbox"
            checked={value.includes(necesidad)}
            onChange={(e) => {
              const siguiente = e.target.checked ? [...value, necesidad] : value.filter((item) => item !== necesidad)
              onChange(siguiente.length ? siguiente : [necesidad])
            }}
          />
          <span>{necesidadLabel[necesidad]}</span>
        </label>
      ))}
    </div>
  )
}

function Recursos({ brechas, recursos, formulario, setFormulario, agregarRecurso, actualizarRecurso }: {
  brechas: { necesidad: Necesidad; demanda: number; oferta: number; brecha: number }[]
  recursos: Recurso[]
  formulario: Omit<Recurso, 'id'>
  setFormulario: (valor: Omit<Recurso, 'id'>) => void
  agregarRecurso: (evento: FormEvent) => void
  actualizarRecurso: (id: string, cambios: Partial<Recurso>) => void
}) {
  return (
    <section className="two-column">
      <div className="panel">
        <h2><PackageCheck size={19} /> Brechas por necesidad</h2>
        <div className="need-list">
          {brechas.map((item) => <div className="need-row" key={item.necesidad}><span>{necesidadLabel[item.necesidad]}</span><meter min="0" max="6" value={Math.min(item.demanda, 6)} /><strong>{item.brecha ? `${item.brecha} brecha` : 'cubierto'}</strong></div>)}
        </div>
        <form className="inline-form" onSubmit={agregarRecurso}>
          <h2><Archive size={19} /> Agregar insumo</h2>
          <div className="form-grid">
            <label>Nombre<input value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required /></label>
            <label>Tipo<select value={formulario.tipo} onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value as Necesidad })}>{necesidades.map((item) => <option key={item} value={item}>{necesidadLabel[item]}</option>)}</select></label>
            <label>Ubicación<input value={formulario.ubicacion} onChange={(e) => setFormulario({ ...formulario, ubicacion: e.target.value })} required /></label>
            <label>Cantidad<input value={formulario.cantidad} onChange={(e) => setFormulario({ ...formulario, cantidad: e.target.value })} required /></label>
            <label>Estado<select value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as Recurso['estado'] })}><option value="disponible">Disponible</option><option value="reservado">Reservado</option><option value="en ruta">En ruta</option><option value="agotado">Agotado</option></select></label>
            <label>Responsable<input value={formulario.responsable} onChange={(e) => setFormulario({ ...formulario, responsable: e.target.value })} /></label>
          </div>
          <button className="primary wide" type="submit">Guardar insumo</button>
        </form>
      </div>
      <div className="panel">
        <h2><Archive size={19} /> Inventario listo</h2>
        <div className="stack">
          {recursos.map((recurso) => (
            <article key={recurso.id}>
              <strong>{recurso.nombre}</strong>
              <p>{recurso.cantidad} · {recurso.ubicacion} · {recurso.responsable || 'sin responsable'}</p>
              <div className="edit-row">
                <span className="pill">{necesidadLabel[recurso.tipo]}</span>
                <select value={recurso.estado} onChange={(e) => actualizarRecurso(recurso.id, { estado: e.target.value as Recurso['estado'] })}>
                  <option value="disponible">Disponible</option><option value="reservado">Reservado</option><option value="en ruta">En ruta</option><option value="agotado">Agotado</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Voluntarios({ voluntarios, casos, formulario, setFormulario, agregarVoluntario, actualizarVoluntario }: {
  voluntarios: Voluntario[]
  casos: Caso[]
  formulario: Omit<Voluntario, 'id'>
  setFormulario: (valor: Omit<Voluntario, 'id'>) => void
  agregarVoluntario: (evento: FormEvent) => void
  actualizarVoluntario: (id: string, cambios: Partial<Voluntario>) => void
}) {
  return (
    <section className="two-column">
      <div className="panel">
        <h2><Users size={19} /> Nuevo registro de directorio</h2>
        <form onSubmit={agregarVoluntario}>
          <div className="form-grid">
            <label>Nombre<input value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required /></label>
            <label>Base<input value={formulario.base} onChange={(e) => setFormulario({ ...formulario, base: e.target.value })} required /></label>
            <label>Rol<select value={formulario.rol} onChange={(e) => setFormulario({ ...formulario, rol: e.target.value as Voluntario['rol'] })}><option value="coordinador">Coordinador</option><option value="verificador">Verificador</option><option value="voluntario">Voluntario</option></select></label>
            <label>Estado<select value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as Voluntario['estado'] })}><option value="disponible">Disponible</option><option value="asignado">Asignado</option><option value="descanso">Descanso</option></select></label>
            <label>Disponibilidad<input value={formulario.disponibilidad} onChange={(e) => setFormulario({ ...formulario, disponibilidad: e.target.value })} placeholder="Ej. 8 personas, 2 camiones" required /></label>
            <label>Turno<input value={formulario.turno} onChange={(e) => setFormulario({ ...formulario, turno: e.target.value })} /></label>
          </div>
          <label>Contacto operativo<input value={formulario.contacto} onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })} /></label>
          <label>Habilidades<SelectorNecesidades value={formulario.habilidades} onChange={(habilidades) => setFormulario({ ...formulario, habilidades })} /></label>
          <button className="primary wide" type="submit">Guardar registro</button>
        </form>
      </div>
      <div className="panel">
        <h2><Users size={19} /> Directorio y asignaciones sugeridas</h2>
        <div className="roster-grid single">
          {voluntarios.map((voluntario) => {
            const sugeridos = casos.filter((caso) => voluntario.habilidades.includes(caso.necesidad)).slice(0, 2)
            return (
              <article key={voluntario.id}>
                <strong>{voluntario.nombre}</strong>
                <p>{voluntario.base} · {voluntario.rol} · {voluntario.disponibilidad} · turno {voluntario.turno}</p>
                <div className="tags">{voluntario.habilidades.map((skill) => <span key={skill}>{necesidadLabel[skill]}</span>)}</div>
                <div className="edit-row">
                  <small>Sugerido: {sugeridos.map((caso) => caso.id).join(', ') || 'sin caso abierto'}</small>
                  <select value={voluntario.estado} onChange={(e) => actualizarVoluntario(voluntario.id, { estado: e.target.value as Voluntario['estado'] })}>
                    <option value="disponible">Disponible</option><option value="asignado">Asignado</option><option value="descanso">Descanso</option>
                  </select>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Albergues({ albergues, formulario, setFormulario, agregarAlbergue, actualizarAlbergue }: {
  albergues: Albergue[]
  formulario: Omit<Albergue, 'id'>
  setFormulario: (valor: Omit<Albergue, 'id'>) => void
  agregarAlbergue: (evento: FormEvent) => void
  actualizarAlbergue: (id: string, cambios: Partial<Albergue>) => void
}) {
  return (
    <section className="two-column">
      <div className="panel">
        <h2><Warehouse size={19} /> Nuevo albergue</h2>
        <form onSubmit={agregarAlbergue}>
          <div className="form-grid">
            <label>Nombre<input value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required /></label>
            <label>Municipio<input value={formulario.municipio} onChange={(e) => setFormulario({ ...formulario, municipio: e.target.value })} required /></label>
            <label>Capacidad<input type="number" min="1" value={formulario.capacidad} onChange={(e) => setFormulario({ ...formulario, capacidad: Number(e.target.value) })} /></label>
            <label>Ocupación<input type="number" min="0" value={formulario.ocupacion} onChange={(e) => setFormulario({ ...formulario, ocupacion: Number(e.target.value) })} /></label>
            <label>Estado<select value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as Albergue['estado'] })}><option value="abierto">Abierto</option><option value="casi lleno">Casi lleno</option><option value="lleno">Lleno</option></select></label>
            <label>Responsable<input value={formulario.responsable} onChange={(e) => setFormulario({ ...formulario, responsable: e.target.value })} /></label>
          </div>
          <label>Necesidades<SelectorNecesidades value={formulario.necesidades} onChange={(necesidades) => setFormulario({ ...formulario, necesidades })} /></label>
          <button className="primary wide" type="submit">Guardar albergue</button>
        </form>
      </div>
      <div className="panel">
        <h2><Warehouse size={19} /> Albergues y ocupación</h2>
        <div className="shelter-grid single">
          {albergues.map((albergue) => (
            <article key={albergue.id}>
              <strong>{albergue.nombre}</strong>
              <p>{albergue.municipio} · {albergue.responsable || 'sin responsable'}</p>
              <meter min="0" max={albergue.capacidad} value={albergue.ocupacion} />
              <div className="edit-row">
                <span>{albergue.ocupacion}/{albergue.capacidad} personas</span>
                <input type="number" min="0" max={albergue.capacidad} value={albergue.ocupacion} onChange={(e) => actualizarAlbergue(albergue.id, { ocupacion: Number(e.target.value) })} />
                <select value={albergue.estado} onChange={(e) => actualizarAlbergue(albergue.id, { estado: e.target.value as Albergue['estado'] })}>
                  <option value="abierto">Abierto</option><option value="casi lleno">Casi lleno</option><option value="lleno">Lleno</option>
                </select>
              </div>
              <div className="tags">{albergue.necesidades.map((n) => <span key={n}>{necesidadLabel[n]}</span>)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Personas({ personas, formulario, setFormulario, agregarPersona, actualizarPersona, privacidadOk, setPrivacidadOk }: {
  personas: Persona[]
  formulario: Omit<Persona, 'id' | 'actualizado'>
  setFormulario: (valor: Omit<Persona, 'id' | 'actualizado'>) => void
  agregarPersona: (evento: FormEvent) => void
  actualizarPersona: (id: string, cambios: Partial<Persona>) => void
  privacidadOk: boolean
  setPrivacidadOk: (valor: boolean) => void
}) {
  return (
    <section className="panel focused">
      <h2><ShieldCheck size={19} /> Verificación mínima de personas</h2>
      <p className="helper">Registra solo grupos o referencias mínimas. Evita nombres completos, cédulas, direcciones privadas o datos médicos.</p>
      <div className="privacy-box">
        <strong>Lista de privacidad</strong>
        <span>Usa etiqueta de grupo, no nombre completo.</span>
        <span>Guarda solo municipio y contacto operativo.</span>
        <span>Revisa la nota antes de exportar.</span>
      </div>
      <form onSubmit={agregarPersona}>
        <div className="form-grid">
          <label>Etiqueta segura<input value={formulario.etiqueta} onChange={(e) => setFormulario({ ...formulario, etiqueta: e.target.value })} placeholder="Ej. Grupo familiar zona norte" required /></label>
          <label>Municipio<input value={formulario.municipio} onChange={(e) => setFormulario({ ...formulario, municipio: e.target.value })} required /></label>
          <label>Estado<select value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as Persona['estado'] })}><option value="sin confirmar">Sin confirmar</option><option value="a salvo">A salvo</option><option value="requiere ayuda">Requiere ayuda</option></select></label>
          <label>Contacto operativo<input value={formulario.contacto} onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })} /></label>
        </div>
        <label>Última nota mínima<textarea rows={3} value={formulario.ultimaNota} onChange={(e) => setFormulario({ ...formulario, ultimaNota: e.target.value })} placeholder="Estado observado, fuente operativa y acción pendiente. Sin detalles sensibles." required /></label>
        <label className="check-row privacy-confirm"><input type="checkbox" checked={privacidadOk} onChange={(e) => setPrivacidadOk(e.target.checked)} required /><span>Confirmo que el registro usa identidad mínima y no contiene datos sensibles.</span></label>
        <button className="primary wide" type="submit" disabled={!privacidadOk}>Guardar check-in</button>
      </form>
      <div className="stack section-gap">
        {personas.map((persona) => (
          <article className={`person ${persona.estado.replace(' ', '-')}`} key={persona.id}>
            <strong>{persona.etiqueta}</strong>
            <p>{persona.municipio} · {persona.contacto || 'sin contacto'} · {persona.actualizado}</p>
            <span>{persona.ultimaNota}</span>
            <div className="edit-row">
              <select value={persona.estado} onChange={(e) => actualizarPersona(persona.id, { estado: e.target.value as Persona['estado'] })}>
                <option value="sin confirmar">Sin confirmar</option><option value="a salvo">A salvo</option><option value="requiere ayuda">Requiere ayuda</option>
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function MiniRow({ title, body, status }: { title: string; body: string; status: string }) {
  return <article className="mini-row"><strong>{title}</strong><p>{body}</p><span>{status}</span></article>
}

function Assignments({ asignaciones, solicitudes, casos, voluntarios, casoActivo, formulario, setFormulario, agregarAsignacion, actualizarAsignacion, solicitudFormulario, setSolicitudFormulario, agregarSolicitud, actualizarSolicitud }: {
  asignaciones: Asignacion[]
  solicitudes: Solicitud[]
  casos: Caso[]
  voluntarios: Voluntario[]
  casoActivo: Caso | null
  formulario: AsignacionForm
  setFormulario: (valor: AsignacionForm) => void
  agregarAsignacion: (evento: FormEvent) => void
  actualizarAsignacion: (id: string, cambios: Partial<Asignacion>) => void
  solicitudFormulario: SolicitudForm
  setSolicitudFormulario: (valor: SolicitudForm) => void
  agregarSolicitud: (evento: FormEvent) => void
  actualizarSolicitud: (id: string, cambios: Partial<Solicitud>) => void
}) {
  const casoDeFormulario = casos.find((caso) => caso.id === formulario.casoId) ?? casoActivo
  const equiposCompatibles = casoDeFormulario ? voluntarios.filter((equipo) => equipo.habilidades.includes(casoDeFormulario.necesidad)) : voluntarios
  return (
    <section className="panel">
      <h2><Truck size={19} /> Tablero de asignaciones</h2>
      {casoActivo && <p className="helper">Caso activo: {casoActivo.id} · {casoActivo.municipio}. Los campos toman sugerencias del caso seleccionado.</p>}
      <form className="inline-form" onSubmit={agregarAsignacion}>
        <div className="form-grid compact">
          <label>Caso<select value={formulario.casoId} onChange={(e) => setFormulario({ ...formulario, casoId: e.target.value })} required><option value="">Seleccionar</option>{casos.map((caso) => <option key={caso.id} value={caso.id}>{caso.id} · {caso.municipio}</option>)}</select></label>
          <label>Equipo<select value={formulario.equipo} onChange={(e) => setFormulario({ ...formulario, equipo: e.target.value })} required><option value="">Seleccionar</option>{equiposCompatibles.map((equipo) => <option key={equipo.id} value={equipo.nombre}>{equipo.nombre} · {equipo.estado}</option>)}</select></label>
          <label>Estado<select value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as Asignacion['estado'] })}><option value="aceptado">Aceptado</option><option value="en ruta">En ruta</option><option value="en sitio">En sitio</option><option value="bloqueado">Bloqueado</option><option value="completado">Completado</option></select></label>
          <label>ETA<input value={formulario.eta} onChange={(e) => setFormulario({ ...formulario, eta: e.target.value })} /></label>
          <label>Responsable<input value={formulario.responsable} onChange={(e) => setFormulario({ ...formulario, responsable: e.target.value })} /></label>
          <label>Nota de bloqueo<input value={formulario.bloqueo ?? ''} onChange={(e) => setFormulario({ ...formulario, bloqueo: e.target.value })} placeholder="Solo si está bloqueada" /></label>
        </div>
        <button className="primary wide" type="submit">Crear asignación</button>
      </form>
      <div className="stack">
        {asignaciones.map((item) => (
          <article key={item.id}>
            <strong>{item.casoId} · {item.equipo}</strong>
            <p>{item.responsable || 'sin responsable'} · ETA {item.eta}</p>
            <div className="edit-row">
              <select value={item.estado} onChange={(e) => actualizarAsignacion(item.id, { estado: e.target.value as Asignacion['estado'] })}>
                <option value="aceptado">Aceptado</option><option value="en ruta">En ruta</option><option value="en sitio">En sitio</option><option value="bloqueado">Bloqueado</option><option value="completado">Completado</option>
              </select>
              <input value={item.eta} onChange={(e) => actualizarAsignacion(item.id, { eta: e.target.value })} aria-label="ETA" />
              <input value={item.bloqueo ?? ''} onChange={(e) => actualizarAsignacion(item.id, { bloqueo: e.target.value })} aria-label="Nota de bloqueo" placeholder="bloqueo" />
            </div>
          </article>
        ))}
      </div>
      <h2><PackageCheck size={19} /> Solicitudes concretas</h2>
      <form className="inline-form" onSubmit={agregarSolicitud}>
        <div className="form-grid compact">
          <label>Caso<select value={solicitudFormulario.casoId} onChange={(e) => setSolicitudFormulario({ ...solicitudFormulario, casoId: e.target.value })} required><option value="">Seleccionar</option>{casos.map((caso) => <option key={caso.id} value={caso.id}>{caso.id} · {caso.municipio}</option>)}</select></label>
          <label>Insumo<input value={solicitudFormulario.item} onChange={(e) => setSolicitudFormulario({ ...solicitudFormulario, item: e.target.value })} required /></label>
          <label>Cantidad requerida<input value={solicitudFormulario.cantidad} onChange={(e) => setSolicitudFormulario({ ...solicitudFormulario, cantidad: e.target.value })} required /></label>
          <label>Entregado<input value={solicitudFormulario.entregado} onChange={(e) => setSolicitudFormulario({ ...solicitudFormulario, entregado: e.target.value })} /></label>
          <label>Punto de entrega<input value={solicitudFormulario.punto} onChange={(e) => setSolicitudFormulario({ ...solicitudFormulario, punto: e.target.value })} required /></label>
          <label>Estado<select value={solicitudFormulario.estado} onChange={(e) => setSolicitudFormulario({ ...solicitudFormulario, estado: e.target.value as Solicitud['estado'] })}><option value="abierta">Abierta</option><option value="comprometida">Comprometida</option><option value="cubierta">Cubierta</option></select></label>
        </div>
        <button className="primary wide" type="submit">Crear solicitud</button>
      </form>
      <div className="stack tight">
        {solicitudes.map((item) => (
          <article key={item.id}>
            <strong>{item.item}</strong>
            <p>{item.casoId} · {item.entregado}/{item.cantidad} · {item.punto}</p>
            <div className="edit-row">
              <span className="pill">{item.estado}</span>
              <select value={item.estado} onChange={(e) => actualizarSolicitud(item.id, { estado: e.target.value as Solicitud['estado'] })}>
                <option value="abierta">Abierta</option><option value="comprometida">Comprometida</option><option value="cubierta">Cubierta</option>
              </select>
              <input value={item.entregado} onChange={(e) => actualizarSolicitud(item.id, { entregado: e.target.value })} aria-label="Entregado" />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Sitrep({ casos }: { casos: Caso[] }) {
  const abiertos = casos.filter((caso) => caso.estado !== 'resuelto')
  const criticos = abiertos.filter((caso) => caso.prioridad === 'critica')
  const sinAsignar = abiertos.filter((caso) => caso.estado === 'nuevo' || caso.estado === 'verificado')
  const texto = `SITREP Colombia: ${abiertos.length} casos abiertos, ${criticos.length} críticos, ${sinAsignar.length} sin asignar. Prioridades: salud, albergue, agua y comunicaciones. Exportar solo datos verificados; revisar información sensible antes de compartir.`

  return (
    <section className="panel">
      <h2><FileDown size={19} /> SITREP y exportación segura</h2>
      <p className="helper">Exporta solo datos verificados. Revisa información sensible antes de compartir.</p>
      <textarea className="sitrep" value={texto} readOnly rows={5} />
      <button className="primary wide" onClick={() => navigator.clipboard?.writeText(texto)}>Copiar resumen</button>
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>
}

export default App

import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Download,
  FileDown,
  HandHeart,
  HeartPulse,
  Home,
  Languages,
  ListChecks,
  MapPinned,
  Megaphone,
  PackageCheck,
  Radio,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
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
type RolUsuario = 'ciudadano' | 'voluntario' | 'coordinador' | 'albergue' | 'logistica'
type FlujoGuiado = 'inicio' | 'necesidad' | 'recursos' | 'coordinar' | 'sitrep'
type PasoNecesidad = 'necesidad' | 'ubicacion' | 'personas' | 'urgencia' | 'contacto' | 'revision'
type PasoOferta = 'oferta' | 'ubicacion' | 'cantidad' | 'disponibilidad' | 'contacto' | 'revision'
type TipoOferta = 'recurso' | 'voluntario'
type SugerenciaAsignacion = {
  casoId: string
  equipoId: string
  eta: string
}
type SitrepFormato = 'whatsapp' | 'radio' | 'email'

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
const estadoAccionLabel: Record<Estado, string> = {
  nuevo: 'Necesita verificación',
  verificado: 'Listo para asignar',
  asignado: 'Alguien ya está yendo',
  resuelto: 'Cerrado',
}
const rolLabel: Record<RolUsuario, string> = {
  ciudadano: 'Ciudadano / enlace comunitario',
  voluntario: 'Voluntario',
  coordinador: 'Coordinador',
  albergue: 'Albergue',
  logistica: 'Logística',
}
const rolAyuda: Record<RolUsuario, string> = {
  ciudadano: 'Reporta una necesidad o confirma información local.',
  voluntario: 'Ve dónde puedes ayudar y qué equipo encaja mejor.',
  coordinador: 'Prioriza casos, verifica y asigna equipos.',
  albergue: 'Revisa familias sin techo, cupos y necesidades básicas.',
  logistica: 'Conecta recursos, rutas, ETA y brechas de insumos.',
}
const plantillaNecesidades: {
  label: string
  necesidad: Necesidad
  prioridad: Prioridad
  notas: string
}[] = [
  { label: 'Necesitamos agua', necesidad: 'agua', prioridad: 'alta', notas: 'Necesitamos agua potable para familias afectadas. Falta punto de distribución confirmado.' },
  { label: 'Heridos / salud', necesidad: 'medica', prioridad: 'critica', notas: 'Hay personas heridas o con necesidad de atención en salud. Se requiere verificación y apoyo médico.' },
  { label: 'Familias sin albergue', necesidad: 'albergue', prioridad: 'alta', notas: 'Familias no pueden volver a sus viviendas y necesitan albergue temporal seguro.' },
  { label: 'Vía bloqueada', necesidad: 'escombros', prioridad: 'alta', notas: 'Hay una vía bloqueada o acceso interrumpido. Se necesita verificación y equipo de remoción.' },
  { label: 'Persona no localizada', necesidad: 'familia', prioridad: 'alta', notas: 'Se reporta una persona o grupo no localizado. Registrar solo datos mínimos y fuente operativa.' },
]
const pasosNecesidad: PasoNecesidad[] = ['necesidad', 'ubicacion', 'personas', 'urgencia', 'contacto', 'revision']
const pasosOferta: PasoOferta[] = ['oferta', 'ubicacion', 'cantidad', 'disponibilidad', 'contacto', 'revision']

const plantillaOfertas: {
  label: string
  modo: TipoOferta
  necesidad: Necesidad
  nombre: string
  cantidad: string
}[] = [
  { label: 'Vehículo', modo: 'voluntario', necesidad: 'transporte', nombre: 'Equipo de transporte', cantidad: '1 vehículo' },
  { label: 'Agua', modo: 'recurso', necesidad: 'agua', nombre: 'Agua potable', cantidad: 'litros por confirmar' },
  { label: 'Alimentos', modo: 'recurso', necesidad: 'alimentos', nombre: 'Kits de alimentos', cantidad: 'cantidad por confirmar' },
  { label: 'Medicamentos/equipo', modo: 'recurso', necesidad: 'medica', nombre: 'Insumos médicos', cantidad: 'cantidad por confirmar' },
  { label: 'Cupos de albergue', modo: 'recurso', necesidad: 'albergue', nombre: 'Cupos de albergue', cantidad: 'cupos por confirmar' },
  { label: 'Radio/comunicaciones', modo: 'voluntario', necesidad: 'comunicaciones', nombre: 'Equipo comunicaciones', cantidad: 'equipo disponible' },
  { label: 'Manos voluntarias', modo: 'voluntario', necesidad: 'alimentos', nombre: 'Voluntarios disponibles', cantidad: 'personas por confirmar' },
  { label: 'Maquinaria', modo: 'voluntario', necesidad: 'escombros', nombre: 'Equipo maquinaria/remoción', cantidad: 'maquinaria por confirmar' },
]

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
  rol: 'colombia-relief-router-role',
}

const horaCorta = () => new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

function siguienteId(prefijo: string, existentes: { id: string }[]) {
  return `${prefijo}-${String(existentes.length + 1).padStart(3, '0')}`
}

function leerRol() {
  const rol = localStorage.getItem(claves.rol)
  return rol && rol in rolLabel ? rol as RolUsuario : 'ciudadano'
}

function crearTextoSitrep(casos: Caso[], asignaciones: Asignacion[], solicitudes: Solicitud[]) {
  const abiertos = casos.filter((caso) => caso.estado !== 'resuelto')
  const criticos = abiertos.filter((caso) => caso.prioridad === 'critica')
  const sinVerificar = abiertos.filter((caso) => caso.estado === 'nuevo')
  const listos = abiertos.filter((caso) => caso.estado === 'verificado')
  const enCamino = asignaciones.filter((item) => item.estado === 'aceptado' || item.estado === 'en ruta' || item.estado === 'en sitio')
  const bloqueados = asignaciones.filter((item) => item.estado === 'bloqueado')
  const necesidadesClave = necesidades
    .map((necesidad) => ({ necesidad, total: abiertos.filter((caso) => caso.necesidad === necesidad).length }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
    .map((item) => `${necesidadLabel[item.necesidad]} ${item.total}`)
    .join(', ') || 'sin necesidades abiertas'
  const municipios = [...new Set(abiertos.map((caso) => caso.municipio).filter(Boolean))].slice(0, 5).join(', ') || 'sin municipios abiertos'
  const solicitudesAbiertas = solicitudes.filter((item) => item.estado !== 'cubierta')

  return [
    `SITREP Colombia ${horaCorta()}`,
    `Casos abiertos: ${abiertos.length}. Críticos: ${criticos.length}. Necesitan verificación: ${sinVerificar.length}. Listos para asignar: ${listos.length}.`,
    `Alguien ya está yendo: ${enCamino.length}. Bloqueados: ${bloqueados.length}. Solicitudes abiertas: ${solicitudesAbiertas.length}.`,
    `Municipios: ${municipios}. Necesidades principales: ${necesidadesClave}.`,
    'Compartir solo por canales autorizados. No incluir cédulas, datos médicos ni direcciones privadas completas.',
  ].join('\n')
}

function ordenarFeedCrisis(casos: Caso[], asignaciones: Asignacion[]) {
  return [...casos]
    .filter((caso) => caso.estado !== 'resuelto')
    .sort((a, b) => {
      const bloqueadoA = asignaciones.some((item) => item.casoId === a.id && item.estado === 'bloqueado')
      const bloqueadoB = asignaciones.some((item) => item.casoId === b.id && item.estado === 'bloqueado')
      const asignadoA = a.estado === 'asignado' || asignaciones.some((item) => item.casoId === a.id)
      const asignadoB = b.estado === 'asignado' || asignaciones.some((item) => item.casoId === b.id)
      const grupo = (caso: Caso, bloqueado: boolean, asignado: boolean) => {
        if (caso.prioridad === 'critica') return 0
        if (caso.estado === 'nuevo') return 1
        if (caso.estado === 'verificado') return asignado ? 4 : 2
        if (!asignado) return 3
        if (bloqueado) return 5
        return 6
      }
      const grupoA = grupo(a, bloqueadoA, asignadoA)
      const grupoB = grupo(b, bloqueadoB, asignadoB)
      if (grupoA !== grupoB) return grupoA - grupoB
      const peso = prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad]
      if (peso !== 0) return peso
      return b.actualizado.localeCompare(a.actualizado)
    })
}

function crearSitrepFormato(texto: string, formato: SitrepFormato) {
  if (formato === 'radio') {
    return texto
      .split('\n')
      .map((linea, indice) => `${indice + 1}. ${linea.replace('SITREP Colombia', 'SITREP COLOMBIA')}`)
      .join('\n')
  }
  if (formato === 'email') {
    return `Asunto: SITREP Colombia - ${horaCorta()}\n\n${texto}\n\nRecordatorio: revisar datos sensibles antes de reenviar.`
  }
  return texto
}

function App() {
  const [vista, setVista] = useState<Vista>('inicio')
  const [flujoGuiado, setFlujoGuiado] = useState<FlujoGuiado>('inicio')
  const [rolUsuario, setRolUsuario] = useState<RolUsuario>(() => leerRol())
  const [pasoNecesidad, setPasoNecesidad] = useState<PasoNecesidad>('necesidad')
  const [pasoOferta, setPasoOferta] = useState<PasoOferta>('oferta')
  const [reporteCopiado, setReporteCopiado] = useState(false)
  const [formatoSitrep, setFormatoSitrep] = useState<SitrepFormato>('whatsapp')
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
  const [guiaNecesidad, setGuiaNecesidad] = useState({
    municipio: '',
    departamento: '',
    necesidad: 'agua' as Necesidad,
    prioridad: 'alta' as Prioridad,
    personas: 1,
    contacto: '',
    coordenadas: '',
    notas: '',
  })
  const [guiaOferta, setGuiaOferta] = useState({
    modo: 'recurso' as TipoOferta,
    nombre: '',
    necesidad: 'agua' as Necesidad,
    ubicacion: '',
    cantidad: '',
    disponibilidad: 'Ahora',
    contacto: '',
  })
  const [sugerenciaAsignacion, setSugerenciaAsignacion] = useState<SugerenciaAsignacion | null>(null)
  const [mensajeSugerencia, setMensajeSugerencia] = useState('')

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

  const feedCrisis = useMemo(() => ordenarFeedCrisis(casos, asignaciones), [asignaciones, casos])
  const casoMasUrgente = feedCrisis[0] ?? filtrados.find((caso) => caso.estado !== 'resuelto')
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
  const textoSitrep = crearSitrepFormato(crearTextoSitrep(casos, asignaciones, solicitudes), formatoSitrep)

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

  function cambiarRol(rol: RolUsuario) {
    setRolUsuario(rol)
    localStorage.setItem(claves.rol, rol)
  }

  function iniciarFlujo(flujo: FlujoGuiado) {
    setFlujoGuiado(flujo)
    setVista('inicio')
    if (flujo === 'necesidad') {
      setPasoNecesidad('necesidad')
    }
    if (flujo === 'recursos') {
      setPasoOferta('oferta')
    }
    if (flujo === 'coordinar') {
      setFiltro('todas')
    }
  }

  function guardarNecesidadGuiada() {
    const nuevo: Caso = {
      id: `COL-${String(casos.length + 1).padStart(3, '0')}`,
      ...guiaNecesidad,
      municipio: guiaNecesidad.municipio.trim(),
      departamento: guiaNecesidad.departamento.trim() || 'Por confirmar',
      personas: Number(guiaNecesidad.personas) || 1,
      contacto: guiaNecesidad.contacto.trim() || 'Fuente por confirmar',
      notas: guiaNecesidad.notas.trim(),
      estado: 'nuevo',
      actualizado: horaCorta(),
    }
    const actualizados = [nuevo, ...casos]
    setCasos(actualizados)
    guardarColeccion(claves.casos, actualizados)
    seleccionarCaso(nuevo)
    setGuiaNecesidad({ municipio: '', departamento: '', necesidad: 'agua', prioridad: 'alta', personas: 1, contacto: '', coordenadas: '', notas: '' })
    setPasoNecesidad('necesidad')
    setFlujoGuiado('coordinar')
    setFiltro('todas')
  }

  function crearAsignacionSugerida(caso: Caso) {
    const equipo = voluntarios.find((item) => item.habilidades.includes(caso.necesidad) && item.estado === 'disponible') ?? voluntarios.find((item) => item.habilidades.includes(caso.necesidad))
    if (!equipo) {
      setSugerenciaAsignacion(null)
      setMensajeSugerencia('No hay equipo compatible; crea solicitud o registra voluntario.')
      setCasoSeleccionadoId(caso.id)
      return
    }
    setSugerenciaAsignacion({
      casoId: caso.id,
      equipoId: equipo.id,
      eta: caso.prioridad === 'critica' ? '20 min' : caso.prioridad === 'alta' ? '35 min' : '60 min',
    })
    setMensajeSugerencia('')
    setCasoSeleccionadoId(caso.id)
  }

  function confirmarAsignacionSugerida() {
    if (!sugerenciaAsignacion) return
    const caso = casos.find((item) => item.id === sugerenciaAsignacion.casoId)
    const equipo = voluntarios.find((item) => item.id === sugerenciaAsignacion.equipoId)
    if (!caso || !equipo) return
    if (caso.estado !== 'verificado') {
      setMensajeSugerencia('Verifica el caso antes de asignar. Esta acción no cambia estados sin confirmación.')
      return
    }
    const nueva: Asignacion = {
      id: siguienteId('ASG', asignaciones),
      casoId: sugerenciaAsignacion.casoId,
      equipo: equipo.nombre,
      estado: 'aceptado',
      eta: sugerenciaAsignacion.eta,
      responsable: equipo.contacto || equipo.nombre,
    }
    const asignacionesActualizadas = [nueva, ...asignaciones]
    setAsignaciones(asignacionesActualizadas)
    guardarColeccion(claves.asignaciones, asignacionesActualizadas)
    guardarCasos(casos.map((item) => item.id === caso.id ? { ...item, estado: 'asignado', responsable: equipo.nombre, actualizado: horaCorta() } : item))
    setCasoSeleccionadoId(caso.id)
    setSugerenciaAsignacion(null)
    setMensajeSugerencia('')
  }

  function guardarOfertaGuiada() {
    if (guiaOferta.modo === 'voluntario') {
      const nuevo: Voluntario = {
        id: siguienteId('EQ', voluntarios),
        nombre: guiaOferta.nombre.trim() || `Equipo ${necesidadLabel[guiaOferta.necesidad]}`,
        base: guiaOferta.ubicacion.trim() || 'Ubicación por confirmar',
        rol: 'voluntario',
        habilidades: [guiaOferta.necesidad],
        disponibilidad: guiaOferta.cantidad.trim() || guiaOferta.disponibilidad.trim() || 'Disponible',
        turno: guiaOferta.disponibilidad.trim() || 'Ahora',
        estado: 'disponible',
        contacto: guiaOferta.contacto.trim() || 'Contacto por confirmar',
      }
      const actualizados = [nuevo, ...voluntarios]
      setVoluntarios(actualizados)
      guardarColeccion(claves.voluntarios, actualizados)
    } else {
      const nuevo: Recurso = {
        id: siguienteId('INV', recursos),
        nombre: guiaOferta.nombre.trim() || necesidadLabel[guiaOferta.necesidad],
        tipo: guiaOferta.necesidad,
        ubicacion: guiaOferta.ubicacion.trim() || 'Ubicación por confirmar',
        cantidad: guiaOferta.cantidad.trim() || 'Cantidad por confirmar',
        estado: 'disponible',
        responsable: guiaOferta.contacto.trim() || 'Responsable por confirmar',
      }
      const actualizados = [nuevo, ...recursos]
      setRecursos(actualizados)
      guardarColeccion(claves.recursos, actualizados)
    }
    setGuiaOferta({ modo: 'recurso', nombre: '', necesidad: 'agua', ubicacion: '', cantidad: '', disponibilidad: 'Ahora', contacto: '' })
    setPasoOferta('oferta')
    setFlujoGuiado('coordinar')
    setFiltro('todas')
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
    <main className={`app vista-${vista}`}>
      <aside className="sidebar">
        <div className="brand-mark">
          <span>A2253</span>
          <div>
            <strong>Ruta Colombia</strong>
            <small>Ape 2253 · coordinación de rescate</small>
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
        <div className="ape-credit" aria-label="Tratamiento de marca Ape 2253">
          <img src="/brand/ape-2253-reference.svg" alt="Ape 2253 coordinador de rescate" />
          <div>
            <strong>Ape 2253</strong>
            <small>El coordinador de rescate visual de esta mesa.</small>
          </div>
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
            <span className="studio-chip">Ape 2253 / Rescue Coordinator</span>
            <div className="actions">
              <button onClick={() => exportar('csv')} title="Descargar casos en CSV"><FileDown size={18} /> CSV</button>
              <button onClick={() => exportar('json')} title="Descargar paquete JSON"><Download size={18} /> JSON</button>
              <button className="quiet" onClick={restaurar} title="Restaurar datos de ejemplo"><Languages size={18} /> Reiniciar</button>
            </div>
          </div>
        </header>

        {vista === 'inicio' && (
          <InicioGuiado
            flujo={flujoGuiado}
            setFlujo={iniciarFlujo}
            rol={rolUsuario}
            setRol={cambiarRol}
            guia={guiaNecesidad}
            setGuia={setGuiaNecesidad}
            paso={pasoNecesidad}
            setPaso={setPasoNecesidad}
            guardarNecesidad={guardarNecesidadGuiada}
            oferta={guiaOferta}
            setOferta={setGuiaOferta}
            pasoOferta={pasoOferta}
            setPasoOferta={setPasoOferta}
            guardarOferta={guardarOfertaGuiada}
            casos={casos}
            casosFiltrados={feedCrisis}
            casoUrgente={casoMasUrgente}
            seleccionarCaso={seleccionarCaso}
            cambiarEstado={cambiarEstado}
            crearAsignacionSugerida={crearAsignacionSugerida}
            confirmarAsignacionSugerida={confirmarAsignacionSugerida}
            sugerenciaAsignacion={sugerenciaAsignacion}
            mensajeSugerencia={mensajeSugerencia}
            voluntarios={voluntarios}
            asignaciones={asignaciones}
            textoSitrep={textoSitrep}
            formatoSitrep={formatoSitrep}
            setFormatoSitrep={setFormatoSitrep}
            reporteCopiado={reporteCopiado}
            setReporteCopiado={setReporteCopiado}
            abrirConsola={() => setVista('operaciones')}
          />
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
                onAsignacionSugerida={crearAsignacionSugerida}
                onConfirmarAsignacion={confirmarAsignacionSugerida}
                sugerenciaAsignacion={sugerenciaAsignacion}
                mensajeSugerencia={mensajeSugerencia}
                voluntarios={voluntarios}
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
              <Sitrep texto={textoSitrep} />
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

function InicioGuiado({ flujo, setFlujo, rol, setRol, guia, setGuia, paso, setPaso, guardarNecesidad, oferta, setOferta, pasoOferta, setPasoOferta, guardarOferta, casos, casosFiltrados, casoUrgente, seleccionarCaso, cambiarEstado, crearAsignacionSugerida, confirmarAsignacionSugerida, sugerenciaAsignacion, mensajeSugerencia, voluntarios, asignaciones, textoSitrep, formatoSitrep, setFormatoSitrep, reporteCopiado, setReporteCopiado, abrirConsola }: {
  flujo: FlujoGuiado
  setFlujo: (flujo: FlujoGuiado) => void
  rol: RolUsuario
  setRol: (rol: RolUsuario) => void
  guia: {
    municipio: string
    departamento: string
    necesidad: Necesidad
    prioridad: Prioridad
    personas: number
    contacto: string
    coordenadas: string
    notas: string
  }
  setGuia: (valor: typeof guia) => void
  paso: PasoNecesidad
  setPaso: (paso: PasoNecesidad) => void
  guardarNecesidad: () => void
  oferta: {
    modo: TipoOferta
    nombre: string
    necesidad: Necesidad
    ubicacion: string
    cantidad: string
    disponibilidad: string
    contacto: string
  }
  setOferta: (valor: typeof oferta) => void
  pasoOferta: PasoOferta
  setPasoOferta: (paso: PasoOferta) => void
  guardarOferta: () => void
  casos: Caso[]
  casosFiltrados: Caso[]
  casoUrgente: Caso | undefined
  seleccionarCaso: (caso: Caso) => void
  cambiarEstado: (id: string, estado: Estado) => void
  crearAsignacionSugerida: (caso: Caso) => void
  confirmarAsignacionSugerida: () => void
  sugerenciaAsignacion: SugerenciaAsignacion | null
  mensajeSugerencia: string
  voluntarios: Voluntario[]
  asignaciones: Asignacion[]
  textoSitrep: string
  formatoSitrep: SitrepFormato
  setFormatoSitrep: (formato: SitrepFormato) => void
  reporteCopiado: boolean
  setReporteCopiado: (valor: boolean) => void
  abrirConsola: () => void
}) {
  const casosAccion = casos
    .filter((caso) => caso.estado !== 'resuelto')
    .sort((a, b) => (prioridadPeso[b.prioridad] + prioridadAccion[b.estado]) - (prioridadPeso[a.prioridad] + prioridadAccion[a.estado]))
  const bloqueados = asignaciones.filter((item) => item.estado === 'bloqueado')

  return (
    <section className="guided-shell">
      <div className="guided-hero">
        <div>
          <p className="eyebrow"><UserRound size={16} /> Modo guiado</p>
          <h2>¿Qué necesitas hacer ahora?</h2>
        </div>
        <div className="mascot-card" aria-label="Ape 2253 coordinador de rescate">
          <img className="mascot-image" src="/brand/ape-2253-reference.svg" alt="Ape 2253 con gorra de coordinador" />
          <div>
            <strong>Ape 2253 / Coordinador de rescate</strong>
            <p>La identidad visual viene de este Ape 2253: serio, de gorra, listo para radio, triage y despacho.</p>
          </div>
        </div>
        <div className="guided-actions">
          <button className={flujo === 'necesidad' ? 'big-action active' : 'big-action'} onClick={() => setFlujo('necesidad')}>
            <Megaphone size={34} />
            <span>Reportar ayuda necesaria</span>
            <small>Agua, salud, albergue, vías o personas no localizadas.</small>
          </button>
          <button className={flujo === 'recursos' ? 'big-action active' : 'big-action'} onClick={() => setFlujo('recursos')}>
            <HandHeart size={34} />
            <span>Tengo recursos / puedo ayudar</span>
            <small>Registra equipo, insumos, cupos, transporte o disponibilidad.</small>
          </button>
          <button className={flujo === 'coordinar' ? 'big-action active' : 'big-action'} onClick={() => setFlujo('coordinar')}>
            <ClipboardList size={34} />
            <span>Coordinar casos</span>
            <small>Verifica, asigna y prepara reportes para compartir.</small>
          </button>
        </div>
        <div className="role-strip secondary">
          <p>{rolAyuda[rol]} Responde una cosa a la vez.</p>
          <label>
            Tu rol
            <select value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)}>
              {Object.entries(rolLabel).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
            </select>
          </label>
        </div>
        <div className="trust-strip">Funciona sin cuenta. Datos guardados en este dispositivo. Copia JSON/CSV antes de cambiar de teléfono o navegador.</div>
      </div>

      {flujo === 'inicio' && (
        <section className="guided-grid">
          <div className="guided-panel">
            <h2><Sparkles size={19} /> Prioridad actual</h2>
            <strong className="large-signal">{casoUrgente?.municipio ?? 'Sin casos abiertos'}</strong>
            <p className="helper">{casoUrgente?.notas ?? 'Cuando llegue un reporte, aparecerá aquí con la siguiente acción.'}</p>
            <div className="step-row simple">
              <Step n="1" title="Reportar" text="Captura ubicación, necesidad y fuente." />
              <Step n="2" title="Verificar" text="Confirma antes de publicar o asignar." />
              <Step n="3" title="Asignar" text="Elige equipo compatible con ETA." />
              <Step n="4" title="Compartir" text="Copia SITREP para WhatsApp, radio o email." />
            </div>
          </div>
          <div className="guided-panel">
            <h2><ListChecks size={19} /> Estado simple</h2>
            <div className="plain-status">
              <MiniRow title="Necesita verificación" body={`${casosAccion.filter((caso) => caso.estado === 'nuevo').length} casos`} status="revisar" />
              <MiniRow title="Listo para asignar" body={`${casosAccion.filter((caso) => caso.estado === 'verificado').length} casos`} status="despachar" />
              <MiniRow title="Alguien ya está yendo" body={`${casosAccion.filter((caso) => caso.estado === 'asignado').length} casos`} status="seguimiento" />
              <MiniRow title="Bloqueado: necesita decisión" body={`${bloqueados.length} asignaciones`} status="decidir" />
            </div>
          </div>
        </section>
      )}

      {flujo === 'necesidad' && (
        <GuidedNeedFlow guia={guia} setGuia={setGuia} paso={paso} setPaso={setPaso} guardar={guardarNecesidad} />
      )}

      {flujo === 'recursos' && (
        <GuidedOfferFlow oferta={oferta} setOferta={setOferta} paso={pasoOferta} setPaso={setPasoOferta} guardar={guardarOferta} />
      )}

      {flujo === 'coordinar' && (
        <GuidedCoordination
          casos={casosFiltrados.length ? casosFiltrados : casosAccion}
          asignaciones={asignaciones}
          seleccionarCaso={seleccionarCaso}
          cambiarEstado={cambiarEstado}
          crearAsignacionSugerida={crearAsignacionSugerida}
          confirmarAsignacionSugerida={confirmarAsignacionSugerida}
          sugerenciaAsignacion={sugerenciaAsignacion}
          mensajeSugerencia={mensajeSugerencia}
          voluntarios={voluntarios}
          abrirConsola={abrirConsola}
        />
      )}

      {flujo === 'sitrep' && (
        <GuidedSitrep texto={textoSitrep} formato={formatoSitrep} setFormato={setFormatoSitrep} copiado={reporteCopiado} setCopiado={setReporteCopiado} />
      )}

      <div className="guided-footer-actions">
        <button onClick={() => setFlujo('sitrep')}><Send size={18} /> Crear reporte para compartir</button>
        <button className="quiet" onClick={() => navigator.clipboard?.writeText(window.location.href)}><Copy size={18} /> Copiar enlace</button>
        <button className="quiet" onClick={abrirConsola}><Activity size={18} /> Modo coordinación</button>
      </div>
    </section>
  )
}

function GuidedNeedFlow({ guia, setGuia, paso, setPaso, guardar }: {
  guia: {
    municipio: string
    departamento: string
    necesidad: Necesidad
    prioridad: Prioridad
    personas: number
    contacto: string
    coordenadas: string
    notas: string
  }
  setGuia: (valor: typeof guia) => void
  paso: PasoNecesidad
  setPaso: (paso: PasoNecesidad) => void
  guardar: () => void
}) {
  const indice = pasosNecesidad.indexOf(paso)
  const puedeAvanzar =
    paso === 'ubicacion' ? Boolean(guia.municipio.trim()) :
      paso === 'necesidad' ? Boolean(guia.notas.trim()) :
        paso === 'personas' ? Number(guia.personas) > 0 :
          paso === 'urgencia' ? Boolean(guia.prioridad) :
            paso === 'contacto' ? Boolean(guia.contacto.trim()) : true
  const siguiente = () => setPaso(pasosNecesidad[Math.min(indice + 1, pasosNecesidad.length - 1)])
  const anterior = () => setPaso(pasosNecesidad[Math.max(indice - 1, 0)])

  return (
    <section className="guided-panel wizard">
      <div className="wizard-progress">
        <span>Paso {indice + 1} de {pasosNecesidad.length}</span>
        <meter min="0" max={pasosNecesidad.length} value={indice + 1} />
      </div>

      {paso === 'ubicacion' && (
        <div className="wizard-step">
          <h2><MapPinned size={20} /> ¿Dónde se necesita ayuda?</h2>
          <label>Municipio o barrio<input autoFocus value={guia.municipio} onChange={(e) => setGuia({ ...guia, municipio: e.target.value })} placeholder="Ej. Cali, San José del Palmar, vereda..." /></label>
          <label>Departamento<input value={guia.departamento} onChange={(e) => setGuia({ ...guia, departamento: e.target.value })} placeholder="Opcional si no está confirmado" /></label>
          <label>Coordenadas o referencia<input value={guia.coordenadas} onChange={(e) => setGuia({ ...guia, coordenadas: e.target.value })} placeholder="Opcional: punto de encuentro, GPS o referencia segura" /></label>
        </div>
      )}

      {paso === 'necesidad' && (
        <div className="wizard-step">
          <h2><Megaphone size={20} /> ¿Qué pasó o qué necesitan?</h2>
          <div className="template-grid">
            {plantillaNecesidades.map((plantilla) => (
              <button key={plantilla.label} type="button" onClick={() => {
                setGuia({ ...guia, necesidad: plantilla.necesidad, prioridad: plantilla.prioridad, notas: plantilla.notas })
              }}>{plantilla.label}</button>
            ))}
          </div>
          <label>Tipo de necesidad<select value={guia.necesidad} onChange={(e) => setGuia({ ...guia, necesidad: e.target.value as Necesidad })}>{necesidades.map((item) => <option key={item} value={item}>{necesidadLabel[item]}</option>)}</select></label>
          <label>Descripción corta<textarea rows={4} value={guia.notas} onChange={(e) => setGuia({ ...guia, notas: e.target.value })} placeholder="Qué pasó, qué falta, punto de referencia y fuente del reporte" /></label>
        </div>
      )}

      {paso === 'personas' && (
        <div className="wizard-step">
          <h2><Users size={20} /> ¿Cuántas personas están afectadas?</h2>
          <label>Personas afectadas<input type="number" min="1" value={guia.personas} onChange={(e) => setGuia({ ...guia, personas: Number(e.target.value) })} /></label>
          <p className="helper">Usa un estimado si no hay conteo exacto. Evita nombres completos o datos privados.</p>
        </div>
      )}

      {paso === 'urgencia' && (
        <div className="wizard-step">
          <h2><HeartPulse size={20} /> ¿Qué tan urgente es?</h2>
          <div className="urgency-grid">
            {(['critica', 'alta', 'media', 'baja'] as Prioridad[]).map((prioridad) => (
              <button key={prioridad} className={guia.prioridad === prioridad ? 'active' : ''} type="button" onClick={() => setGuia({ ...guia, prioridad })}>
                <strong>{prioridadLabel[prioridad]}</strong>
                <small>{prioridad === 'critica' ? 'Riesgo de vida ahora' : prioridad === 'alta' ? 'Necesita respuesta pronto' : prioridad === 'media' ? 'Requiere seguimiento' : 'Puede esperar'}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 'contacto' && (
        <div className="wizard-step">
          <h2><Radio size={20} /> ¿Quién reporta o confirma?</h2>
          <label>Contacto o fuente operativa<input value={guia.contacto} onChange={(e) => setGuia({ ...guia, contacto: e.target.value })} placeholder="Ej. enlace comunitario, radio local, PMU municipal" /></label>
          <p className="helper">Anota un canal operativo. No incluyas información privada si este reporte se compartirá.</p>
        </div>
      )}

      {paso === 'revision' && (
        <div className="wizard-step review-card">
          <h2><CheckCircle2 size={20} /> Revisar y guardar</h2>
          <MiniRow title="Lugar" body={`${guia.municipio || 'Sin municipio'} · ${guia.departamento || 'Departamento por confirmar'}`} status={guia.coordenadas || 'sin GPS'} />
          <MiniRow title="Necesidad" body={`${necesidadLabel[guia.necesidad]} · ${prioridadLabel[guia.prioridad]}`} status={`${guia.personas} personas`} />
          <MiniRow title="Fuente" body={guia.contacto || 'Fuente por confirmar'} status="nuevo caso" />
          <p>{guia.notas}</p>
        </div>
      )}

      <div className="wizard-actions">
        <button type="button" onClick={anterior} disabled={indice === 0}><ArrowLeft size={18} /> Atrás</button>
        {paso === 'revision'
          ? <button className="primary" type="button" onClick={guardar} disabled={!guia.municipio.trim() || !guia.notas.trim()}><CheckCircle2 size={18} /> Guardar caso</button>
          : <button className="primary" type="button" onClick={siguiente} disabled={!puedeAvanzar}>Siguiente <ArrowRight size={18} /></button>}
      </div>
    </section>
  )
}

function GuidedOfferFlow({ oferta, setOferta, paso, setPaso, guardar }: {
  oferta: {
    modo: TipoOferta
    nombre: string
    necesidad: Necesidad
    ubicacion: string
    cantidad: string
    disponibilidad: string
    contacto: string
  }
  setOferta: (valor: typeof oferta) => void
  paso: PasoOferta
  setPaso: (paso: PasoOferta) => void
  guardar: () => void
}) {
  const indice = pasosOferta.indexOf(paso)
  const puedeAvanzar =
    paso === 'oferta' ? Boolean(oferta.nombre.trim()) :
      paso === 'ubicacion' ? Boolean(oferta.ubicacion.trim()) :
        paso === 'cantidad' ? Boolean(oferta.cantidad.trim()) :
          paso === 'disponibilidad' ? Boolean(oferta.disponibilidad.trim()) :
            paso === 'contacto' ? Boolean(oferta.contacto.trim()) : true
  const siguiente = () => setPaso(pasosOferta[Math.min(indice + 1, pasosOferta.length - 1)])
  const anterior = () => setPaso(pasosOferta[Math.max(indice - 1, 0)])

  return (
    <section className="guided-panel wizard">
      <div className="wizard-progress">
        <span>Paso {indice + 1} de {pasosOferta.length}</span>
        <meter min="0" max={pasosOferta.length} value={indice + 1} />
      </div>

      {paso === 'oferta' && (
        <div className="wizard-step">
          <h2><HandHeart size={20} /> ¿Qué puedes ofrecer?</h2>
          <div className="template-grid">
            {plantillaOfertas.map((plantilla) => (
              <button
                key={plantilla.label}
                type="button"
                onClick={() => setOferta({
                  ...oferta,
                  modo: plantilla.modo,
                  necesidad: plantilla.necesidad,
                  nombre: plantilla.nombre,
                  cantidad: plantilla.cantidad,
                })}
              >
                {plantilla.label}
              </button>
            ))}
          </div>
          <div className="segmented">
            <button type="button" className={oferta.modo === 'recurso' ? 'active' : ''} onClick={() => setOferta({ ...oferta, modo: 'recurso' })}>Insumo / cupo</button>
            <button type="button" className={oferta.modo === 'voluntario' ? 'active' : ''} onClick={() => setOferta({ ...oferta, modo: 'voluntario' })}>Equipo / voluntario</button>
          </div>
          <label>Nombre corto<input autoFocus value={oferta.nombre} onChange={(e) => setOferta({ ...oferta, nombre: e.target.value })} placeholder="Ej. Agua potable, camión, cuadrilla, radio VHF" /></label>
          <label>Tipo<select value={oferta.necesidad} onChange={(e) => setOferta({ ...oferta, necesidad: e.target.value as Necesidad })}>{necesidades.map((item) => <option key={item} value={item}>{necesidadLabel[item]}</option>)}</select></label>
        </div>
      )}

      {paso === 'ubicacion' && (
        <div className="wizard-step">
          <h2><MapPinned size={20} /> ¿Dónde está disponible?</h2>
          <label>Municipio, barrio o punto de salida<input autoFocus value={oferta.ubicacion} onChange={(e) => setOferta({ ...oferta, ubicacion: e.target.value })} placeholder="Ej. Cali norte, Manizales, bodega municipal" /></label>
          <p className="helper">Usa una referencia operativa, no una dirección privada completa.</p>
        </div>
      )}

      {paso === 'cantidad' && (
        <div className="wizard-step">
          <h2><PackageCheck size={20} /> ¿Cuánto hay o cuántas personas pueden ayudar?</h2>
          <label>Cantidad o capacidad<input autoFocus value={oferta.cantidad} onChange={(e) => setOferta({ ...oferta, cantidad: e.target.value })} placeholder="Ej. 5.000 L, 2 camiones, 8 voluntarios, 40 cupos" /></label>
        </div>
      )}

      {paso === 'disponibilidad' && (
        <div className="wizard-step">
          <h2><Truck size={20} /> ¿Desde cuándo y por cuánto tiempo?</h2>
          <label>Disponibilidad<input autoFocus value={oferta.disponibilidad} onChange={(e) => setOferta({ ...oferta, disponibilidad: e.target.value })} placeholder="Ej. ahora, 6 horas, mañana 8 a. m., esta noche" /></label>
        </div>
      )}

      {paso === 'contacto' && (
        <div className="wizard-step">
          <h2><Radio size={20} /> ¿A quién contactan?</h2>
          <label>Contacto operativo<input autoFocus value={oferta.contacto} onChange={(e) => setOferta({ ...oferta, contacto: e.target.value })} placeholder="Ej. radio logística, enlace de bodega, teléfono operativo" /></label>
          <p className="helper">Este dato se guarda solo en este navegador hasta que exportes o copies.</p>
        </div>
      )}

      {paso === 'revision' && (
        <div className="wizard-step review-card">
          <h2><CheckCircle2 size={20} /> Revisar y registrar</h2>
          <MiniRow title={oferta.modo === 'recurso' ? 'Recurso' : 'Equipo / voluntario'} body={`${oferta.nombre || 'Sin nombre'} · ${necesidadLabel[oferta.necesidad]}`} status={oferta.modo} />
          <MiniRow title="Lugar" body={oferta.ubicacion || 'Ubicación por confirmar'} status={oferta.disponibilidad || 'sin horario'} />
          <MiniRow title="Cantidad" body={oferta.cantidad || 'Cantidad por confirmar'} status={oferta.contacto || 'sin contacto'} />
        </div>
      )}

      <div className="wizard-actions">
        <button type="button" onClick={anterior} disabled={indice === 0}><ArrowLeft size={18} /> Atrás</button>
        {paso === 'revision'
          ? <button className="primary" type="button" onClick={guardar} disabled={!oferta.nombre.trim() || !oferta.ubicacion.trim()}><CheckCircle2 size={18} /> Registrar ayuda</button>
          : <button className="primary" type="button" onClick={siguiente} disabled={!puedeAvanzar}>Siguiente <ArrowRight size={18} /></button>}
      </div>
    </section>
  )
}

function GuidedCoordination({ casos, asignaciones, seleccionarCaso, cambiarEstado, crearAsignacionSugerida, confirmarAsignacionSugerida, sugerenciaAsignacion, mensajeSugerencia, voluntarios, abrirConsola }: {
  casos: Caso[]
  asignaciones: Asignacion[]
  seleccionarCaso: (caso: Caso) => void
  cambiarEstado: (id: string, estado: Estado) => void
  crearAsignacionSugerida: (caso: Caso) => void
  confirmarAsignacionSugerida: () => void
  sugerenciaAsignacion: SugerenciaAsignacion | null
  mensajeSugerencia: string
  voluntarios: Voluntario[]
  abrirConsola: () => void
}) {
  return (
    <section className="guided-panel">
      <div className="panel-header">
        <div>
          <h2><ClipboardList size={19} /> Coordinar casos</h2>
          <p className="helper">Etiquetas simples para decidir rápido: verificar, asignar, seguimiento o decisión.</p>
        </div>
        <button className="quiet" onClick={abrirConsola}><Activity size={18} /> Consola completa</button>
      </div>
      <div className="plain-filter-row">
        <span>Necesita verificación</span>
        <span>Listo para asignar</span>
        <span>Alguien ya está yendo</span>
        <span>Bloqueado: necesita decisión</span>
      </div>
      <div className="guided-case-list">
        {casos.length ? casos.slice(0, 8).map((caso) => {
          const asignacion = asignaciones.find((item) => item.casoId === caso.id)
          const estadoSimple = asignacion?.estado === 'bloqueado' ? 'Bloqueado: necesita decisión' : estadoAccionLabel[caso.estado]
          const sugerenciaActiva = sugerenciaAsignacion?.casoId === caso.id
          const equipoSugerido = sugerenciaActiva ? voluntarios.find((item) => item.id === sugerenciaAsignacion.equipoId) : null
          return (
            <article key={caso.id} className={`guided-case ${caso.prioridad}`}>
              <button type="button" className="case-main" onClick={() => seleccionarCaso(caso)}>
                <strong>{caso.municipio} · {necesidadLabel[caso.necesidad]}</strong>
                <p>{caso.notas}</p>
                <div className="meta"><span>{estadoSimple}</span><span>{prioridadLabel[caso.prioridad]}</span><span>{caso.personas} personas</span></div>
              </button>
              <div className="guided-case-actions">
                <button onClick={() => cambiarEstado(caso.id, 'verificado')} disabled={caso.estado !== 'nuevo'}><CheckCircle2 size={16} /> Verificado</button>
                <button className="primary" onClick={() => crearAsignacionSugerida(caso)} disabled={caso.estado === 'asignado' || caso.estado === 'resuelto'}><Truck size={16} /> Sugerir equipo</button>
              </div>
              {sugerenciaActiva && equipoSugerido && (
                <div className="assignment-confirm">
                  <strong>Asignación sugerida</strong>
                  <p>{equipoSugerido.nombre} · ETA {sugerenciaAsignacion.eta}</p>
                  {caso.estado !== 'verificado' && <small>Verifica este caso antes de asignar.</small>}
                  <button className="primary" onClick={confirmarAsignacionSugerida} disabled={caso.estado !== 'verificado'}><CheckCircle2 size={16} /> Confirmar asignación</button>
                </div>
              )}
            </article>
          )
        }) : <Empty text="No hay casos abiertos para coordinar." />}
        {mensajeSugerencia && <div className="empty visible-message">{mensajeSugerencia}</div>}
      </div>
    </section>
  )
}

function GuidedSitrep({ texto, formato, setFormato, copiado, setCopiado }: { texto: string; formato: SitrepFormato; setFormato: (formato: SitrepFormato) => void; copiado: boolean; setCopiado: (valor: boolean) => void }) {
  return (
    <section className="guided-panel sitrep-panel">
      <h2><Send size={19} /> Crear reporte para compartir</h2>
      <p className="helper">Elige formato, copia y abre en el teléfono que tenga señal. Revisa antes de enviar por canales públicos.</p>
      <div className="segmented">
        <button className={formato === 'whatsapp' ? 'active' : ''} onClick={() => setFormato('whatsapp')}>WhatsApp</button>
        <button className={formato === 'radio' ? 'active' : ''} onClick={() => setFormato('radio')}>Radio</button>
        <button className={formato === 'email' ? 'active' : ''} onClick={() => setFormato('email')}>Email</button>
      </div>
      <textarea className="sitrep big" value={texto} readOnly rows={7} />
      <button
        className="primary wide"
        onClick={() => {
          navigator.clipboard?.writeText(texto)
          setCopiado(true)
          window.setTimeout(() => setCopiado(false), 1800)
        }}
      >
        <Copy size={18} /> {copiado ? 'Reporte copiado' : 'Copiar reporte'}
      </button>
    </section>
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

function CasoDetalle({ caso, asignaciones, solicitudes, equipos, recursos, albergues, onEstado, onAsignacionSugerida, onConfirmarAsignacion, sugerenciaAsignacion, mensajeSugerencia, voluntarios, onAsignar }: {
  caso: Caso | null
  asignaciones: Asignacion[]
  solicitudes: Solicitud[]
  equipos: Voluntario[]
  recursos: Recurso[]
  albergues: Albergue[]
  onEstado: (id: string, estado: Estado) => void
  onAsignacionSugerida: (caso: Caso) => void
  onConfirmarAsignacion: () => void
  sugerenciaAsignacion: SugerenciaAsignacion | null
  mensajeSugerencia: string
  voluntarios: Voluntario[]
  onAsignar: (caso: Caso) => void
}) {
  if (!caso) {
    return <section className="panel"><Empty text="Selecciona un caso para ver verificación, sugerencias y acciones." /></section>
  }
  const asignacionCaso = asignaciones.find((item) => item.casoId === caso.id)
  const solicitudesCaso = solicitudes.filter((item) => item.casoId === caso.id)
  const sugerenciaActiva = sugerenciaAsignacion?.casoId === caso.id
  const equipoSugerido = sugerenciaActiva ? voluntarios.find((item) => item.id === sugerenciaAsignacion.equipoId) : null
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
        <button className="primary" onClick={() => onAsignacionSugerida(caso)} disabled={caso.estado === 'asignado' || caso.estado === 'resuelto'}><Truck size={17} /> Sugerir equipo</button>
        <button onClick={() => onAsignar(caso)}><ClipboardList size={17} /> Editar asignación</button>
      </div>
      {equipoSugerido && (
        <div className="assignment-confirm">
          <strong>Confirmar antes de asignar</strong>
          <p>Asignar {caso.id} a {equipoSugerido.nombre} con ETA {sugerenciaAsignacion?.eta}?</p>
          {caso.estado !== 'verificado' && <small>Este caso debe estar verificado antes de crear la asignación.</small>}
          <button className="primary" onClick={onConfirmarAsignacion} disabled={caso.estado !== 'verificado'}><CheckCircle2 size={17} /> Confirmar asignación</button>
        </div>
      )}
      {mensajeSugerencia && !equipoSugerido && <div className="empty visible-message">{mensajeSugerencia}</div>}

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

function Sitrep({ texto }: { texto: string }) {
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

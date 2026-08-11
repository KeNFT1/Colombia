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
type Filtro = 'todas' | 'criticas' | 'sin-verificar' | 'sin-asignar' | Necesidad

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
  nombre: string
  base: string
  habilidades: Necesidad[]
  disponibilidad: string
  turno: string
}

type Recurso = {
  nombre: string
  tipo: Necesidad
  ubicacion: string
  cantidad: string
  estado: 'disponible' | 'en ruta' | 'reservado'
}

type Albergue = {
  nombre: string
  municipio: string
  capacidad: number
  ocupacion: number
  necesidades: Necesidad[]
}

type Persona = {
  etiqueta: string
  municipio: string
  estado: 'sin confirmar' | 'a salvo' | 'requiere ayuda'
  ultimaNota: string
}

type Asignacion = {
  id: string
  casoId: string
  equipo: string
  estado: 'aceptado' | 'en ruta' | 'en sitio' | 'bloqueado'
  eta: string
  responsable: string
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

const necesidades: Necesidad[] = ['medica', 'albergue', 'agua', 'alimentos', 'escombros', 'transporte', 'comunicaciones', 'familia']
const estados: Estado[] = ['nuevo', 'verificado', 'asignado', 'resuelto']
const prioridadPeso: Record<Prioridad, number> = { critica: 4, alta: 3, media: 2, baja: 1 }
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

const voluntarios: Voluntario[] = [
  { nombre: 'Brigada médica occidente', base: 'Cali', habilidades: ['medica', 'transporte'], disponibilidad: '24 h', turno: 'Noche' },
  { nombre: 'Célula albergues alfa', base: 'Cali', habilidades: ['albergue', 'alimentos', 'agua'], disponibilidad: '18 personas', turno: 'Mañana' },
  { nombre: 'Equipo radio Quibdó', base: 'Quibdó', habilidades: ['comunicaciones'], disponibilidad: '6 kits radio', turno: 'Ahora' },
  { nombre: 'Logística norte', base: 'Manizales', habilidades: ['agua', 'alimentos', 'transporte'], disponibilidad: '2 camiones', turno: 'Ahora' },
  { nombre: 'Cuadrilla eje cafetero', base: 'Pereira', habilidades: ['escombros', 'albergue'], disponibilidad: 'en espera', turno: 'Madrugada' },
]

const recursos: Recurso[] = [
  { nombre: 'Kits de trauma', tipo: 'medica', ubicacion: 'Cali', cantidad: '14 cajas', estado: 'en ruta' },
  { nombre: 'Agua potable', tipo: 'agua', ubicacion: 'Manizales', cantidad: '5.000 L', estado: 'disponible' },
  { nombre: 'Carpas familiares', tipo: 'albergue', ubicacion: 'Cali', cantidad: '120 uds', estado: 'reservado' },
  { nombre: 'Radios VHF', tipo: 'comunicaciones', ubicacion: 'Quibdó', cantidad: '6 kits', estado: 'disponible' },
  { nombre: 'Retroexcavadora', tipo: 'escombros', ubicacion: 'Pereira', cantidad: '1 unidad', estado: 'reservado' },
]

const albergues: Albergue[] = [
  { nombre: 'Gimnasio escolar norte', municipio: 'Manizales', capacidad: 180, ocupacion: 96, necesidades: ['agua', 'alimentos'] },
  { nombre: 'Coliseo comunal sur', municipio: 'Cali', capacidad: 420, ocupacion: 311, necesidades: ['albergue', 'agua', 'comunicaciones'] },
  { nombre: 'Centro parroquial', municipio: 'Quibdó', capacidad: 95, ocupacion: 54, necesidades: ['alimentos', 'comunicaciones'] },
]

const personas: Persona[] = [
  { etiqueta: 'Grupo familiar A', municipio: 'Cali', estado: 'a salvo', ultimaNota: 'Registrado en mesa de albergue.' },
  { etiqueta: 'Grupo familiar B', municipio: 'San José del Palmar', estado: 'sin confirmar', ultimaNota: 'Último reporte cerca de plaza central.' },
  { etiqueta: 'Lista traslado pacientes', municipio: 'Pereira', estado: 'requiere ayuda', ultimaNota: 'Pendiente confirmación de ambulancia.' },
]

const asignaciones: Asignacion[] = [
  { id: 'ASG-01', casoId: 'COL-001', equipo: 'Brigada médica occidente', estado: 'en ruta', eta: '35 min', responsable: 'Coordinación salud' },
  { id: 'ASG-02', casoId: 'COL-002', equipo: 'Célula albergues alfa', estado: 'en sitio', eta: '0 min', responsable: 'Mesa albergues' },
  { id: 'ASG-03', casoId: 'COL-004', equipo: 'Equipo radio Quibdó', estado: 'aceptado', eta: '50 min', responsable: 'Comunicaciones' },
]

const solicitudes: Solicitud[] = [
  { id: 'REQ-01', casoId: 'COL-001', item: 'Kits de trauma', cantidad: '20', entregado: '14', punto: 'Hospital local', estado: 'comprometida' },
  { id: 'REQ-02', casoId: 'COL-002', item: 'Carpas familiares', cantidad: '160', entregado: '120', punto: 'Coliseo comunal sur', estado: 'abierta' },
  { id: 'REQ-03', casoId: 'COL-005', item: 'Agua potable', cantidad: '5.000 L', entregado: '5.000 L', punto: 'Gimnasio escolar norte', estado: 'cubierta' },
]

function leerCasos() {
  const guardado = localStorage.getItem('colombia-relief-router-cases')
  if (!guardado) return casosBase
  try {
    return JSON.parse(guardado) as Caso[]
  } catch {
    return casosBase
  }
}

function guardarCasos(registros: Caso[]) {
  localStorage.setItem('colombia-relief-router-cases', JSON.stringify(registros))
}

function App() {
  const [vista, setVista] = useState<Vista>('inicio')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [casos, setCasos] = useState<Caso[]>(leerCasos)
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

  const abiertos = casos.filter((caso) => caso.estado !== 'resuelto')
  const filtrados = useMemo(() => {
    return casos
      .filter((caso) => {
        if (filtro === 'todas') return true
        if (filtro === 'criticas') return caso.prioridad === 'critica'
        if (filtro === 'sin-verificar') return caso.estado === 'nuevo'
        if (filtro === 'sin-asignar') return caso.estado === 'nuevo' || caso.estado === 'verificado'
        return caso.necesidad === filtro
      })
      .filter((caso) => `${caso.municipio} ${caso.departamento} ${caso.notas}`.toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad])
  }, [busqueda, casos, filtro])

  const brechas = necesidades.map((necesidad) => {
    const demanda = abiertos.filter((caso) => caso.necesidad === necesidad).length
    const oferta = voluntarios.filter((voluntario) => voluntario.habilidades.includes(necesidad)).length + recursos.filter((recurso) => recurso.tipo === necesidad).length
    return { necesidad, demanda, oferta, brecha: Math.max(demanda - oferta, 0) }
  })

  const casoMasUrgente = filtrados.find((caso) => caso.estado !== 'resuelto')

  function agregarCaso(evento: FormEvent) {
    evento.preventDefault()
    const nuevo: Caso = {
      id: `COL-${String(casos.length + 1).padStart(3, '0')}`,
      ...formulario,
      personas: Number(formulario.personas),
      estado: 'nuevo',
      actualizado: new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }),
    }
    const actualizados = [nuevo, ...casos]
    setCasos(actualizados)
    guardarCasos(actualizados)
    setFormulario({ ...formulario, municipio: '', departamento: '', personas: 1, contacto: '', coordenadas: '', notas: '' })
    setVista('operaciones')
  }

  function cambiarEstado(id: string, estado: Estado) {
    const actualizados = casos.map((caso) =>
      caso.id === id
        ? { ...caso, estado, actualizado: new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) }
        : caso,
    )
    setCasos(actualizados)
    guardarCasos(actualizados)
  }

  function exportar(tipo: 'json' | 'csv') {
    const contenido =
      tipo === 'json'
        ? JSON.stringify({ casos, voluntarios, recursos, albergues, personas, exportado: new Date().toISOString() }, null, 2)
        : [
            'id,municipio,departamento,necesidad,prioridad,personas,contacto,coordenadas,estado,responsable,actualizado,notas',
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
              ]
                .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
                .join(','),
            ),
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
    guardarCasos(casosBase)
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
          <NavButton active={vista === 'voluntarios'} icon={<Users />} label="Voluntarios" onClick={() => setVista('voluntarios')} />
          <NavButton active={vista === 'albergues'} icon={<Warehouse />} label="Albergues" onClick={() => setVista('albergues')} />
          <NavButton active={vista === 'personas'} icon={<ShieldCheck />} label="Personas" onClick={() => setVista('personas')} />
        </nav>
        <div className="sidebar-note">
          <Bell size={16} />
          <span>Datos locales. Exporta solo información verificada.</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow"><Radio size={16} /> Respuesta sísmica · Colombia</p>
            <h1>Mesa de Respuesta - Sismo Colombia</h1>
            <p>Registra reportes, prioriza casos y coordina equipos locales.</p>
          </div>
          <div className="actions">
            <button onClick={() => exportar('csv')} title="Descargar casos en CSV"><FileDown size={18} /> CSV</button>
            <button onClick={() => exportar('json')} title="Descargar paquete JSON"><Download size={18} /> JSON</button>
            <button className="quiet" onClick={restaurar} title="Restaurar datos de ejemplo"><Languages size={18} /> Reiniciar</button>
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
            <Metricas casos={casos} />
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
                  {necesidades.map((necesidad) => <button key={necesidad} className={filtro === necesidad ? 'active' : ''} onClick={() => setFiltro(necesidad)}>{necesidadLabel[necesidad]}</button>)}
                </div>
                <div className="case-list">
                  {filtrados.length ? filtrados.map((caso) => <CasoFila key={caso.id} caso={caso} onEstado={cambiarEstado} />) : <Empty text="No hay casos con este filtro." />}
                </div>
              </div>
              <div className="panel">
                <h2><Route size={19} /> Siguiente mejor acción</h2>
                {casoMasUrgente ? (
                  <div className="next-action">
                    <strong>{casoMasUrgente.id} · {casoMasUrgente.municipio}</strong>
                    <p>{casoMasUrgente.notas}</p>
                    <span>Recomendación: verificar fuente, llamar contacto y asignar equipo con habilidad {necesidadLabel[casoMasUrgente.necesidad]}.</span>
                  </div>
                ) : <p>No hay casos abiertos.</p>}
                <h2><ShieldCheck size={19} /> Verificación</h2>
                <div className="verification-list">
                  <MiniRow title="Fuente local" body="PMU municipal, Cruz Roja local o enlace comunitario." status="confiable" />
                  <MiniRow title="Evidencia mínima" body="Hora, lugar, necesidad, personas afectadas y quién reporta." status="revisar" />
                  <MiniRow title="Privacidad" body="Contactos y notas quedan internos; revisa antes de exportar." status="interno" />
                </div>
                <h2><MapPinned size={19} /> Vista territorial</h2>
                <div className="map-board">
                  {casos.map((caso, index) => (
                    <button key={caso.id} className={`pin ${caso.prioridad}`} style={{ left: `${16 + index * 14}%`, top: `${24 + (index % 4) * 14}%` }} title={`${caso.municipio}: ${caso.necesidad}`} />
                  ))}
                </div>
              </div>
            </section>
            <section className="support-grid">
              <Assignments />
              <Sitrep casos={casos} />
            </section>
          </>
        )}

        {vista === 'ingreso' && <Ingreso formulario={formulario} setFormulario={setFormulario} agregarCaso={agregarCaso} />}
        {vista === 'recursos' && <Recursos brechas={brechas} recursos={recursos} />}
        {vista === 'voluntarios' && <Voluntarios voluntarios={voluntarios} casos={abiertos} />}
        {vista === 'albergues' && <Albergues albergues={albergues} />}
        {vista === 'personas' && <Personas personas={personas} />}
      </section>
    </main>
  )
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={active ? 'nav active' : 'nav'} onClick={onClick}>{icon}<span>{label}</span></button>
}

function Metricas({ casos }: { casos: Caso[] }) {
  const abiertos = casos.filter((caso) => caso.estado !== 'resuelto')
  return (
    <section className="metrics">
      <Metric icon={<Activity />} label="Casos abiertos" value={abiertos.length} />
      <Metric icon={<HeartPulse />} label="Críticos" value={casos.filter((caso) => caso.prioridad === 'critica').length} />
      <Metric icon={<Truck />} label="Asignados" value={casos.filter((caso) => caso.estado === 'asignado').length} />
      <Metric icon={<CheckCircle2 />} label="Resueltos" value={casos.filter((caso) => caso.estado === 'resuelto').length} />
    </section>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div className="metric">{icon}<span>{label}</span><strong>{value}</strong></div>
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return <article><span>{n}</span><strong>{title}</strong><p>{text}</p></article>
}

function CasoFila({ caso, onEstado }: { caso: Caso; onEstado: (id: string, estado: Estado) => void }) {
  return (
    <article className={`case-row ${caso.prioridad}`}>
      <div>
        <div className="row-title"><strong>{caso.id}</strong><span>{caso.municipio}, {caso.departamento}</span></div>
        <p>{caso.notas}</p>
        <div className="meta">
          <span>{necesidadLabel[caso.necesidad]}</span><span>{prioridadLabel[caso.prioridad]}</span><span>{caso.personas} personas</span><span>{caso.coordenadas || 'sin coordenadas'}</span>
        </div>
      </div>
      <div className="status-box">
        <select value={caso.estado} onChange={(e) => onEstado(caso.id, e.target.value as Estado)}>
          {estados.map((estado) => <option key={estado} value={estado}>{estadoLabel[estado]}</option>)}
        </select>
        <small>{caso.actualizado}</small>
      </div>
    </article>
  )
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

function Recursos({ brechas, recursos }: { brechas: { necesidad: Necesidad; demanda: number; oferta: number; brecha: number }[]; recursos: Recurso[] }) {
  return (
    <section className="two-column">
      <div className="panel">
        <h2><PackageCheck size={19} /> Brechas por necesidad</h2>
        <div className="need-list">
          {brechas.map((item) => <div className="need-row" key={item.necesidad}><span>{necesidadLabel[item.necesidad]}</span><meter min="0" max="6" value={Math.min(item.demanda, 6)} /><strong>{item.brecha ? `${item.brecha} brecha` : 'cubierto'}</strong></div>)}
        </div>
      </div>
      <div className="panel">
        <h2><Archive size={19} /> Inventario listo</h2>
        <div className="stack">
          {recursos.map((recurso) => <article key={recurso.nombre}><strong>{recurso.nombre}</strong><p>{recurso.cantidad} · {recurso.ubicacion}</p><span className="pill">{necesidadLabel[recurso.tipo]} · {recurso.estado}</span></article>)}
        </div>
      </div>
    </section>
  )
}

function Voluntarios({ voluntarios, casos }: { voluntarios: Voluntario[]; casos: Caso[] }) {
  return (
    <section className="panel">
      <h2><Users size={19} /> Equipos y asignaciones sugeridas</h2>
      <div className="roster-grid">
        {voluntarios.map((voluntario) => {
          const sugeridos = casos.filter((caso) => voluntario.habilidades.includes(caso.necesidad)).slice(0, 2)
          return <article key={voluntario.nombre}><strong>{voluntario.nombre}</strong><p>{voluntario.base} · {voluntario.disponibilidad} · turno {voluntario.turno}</p><div className="tags">{voluntario.habilidades.map((skill) => <span key={skill}>{necesidadLabel[skill]}</span>)}</div><small>Sugerido: {sugeridos.map((caso) => caso.id).join(', ') || 'sin caso abierto'}</small></article>
        })}
      </div>
    </section>
  )
}

function Albergues({ albergues }: { albergues: Albergue[] }) {
  return (
    <section className="panel">
      <h2><Warehouse size={19} /> Albergues y ocupación</h2>
      <div className="shelter-grid">
        {albergues.map((albergue) => <article key={albergue.nombre}><strong>{albergue.nombre}</strong><p>{albergue.municipio}</p><meter min="0" max={albergue.capacidad} value={albergue.ocupacion} /><span>{albergue.ocupacion}/{albergue.capacidad} personas</span><div className="tags">{albergue.necesidades.map((n) => <span key={n}>{necesidadLabel[n]}</span>)}</div></article>)}
      </div>
    </section>
  )
}

function Personas({ personas }: { personas: Persona[] }) {
  return (
    <section className="panel focused">
      <h2><ShieldCheck size={19} /> Verificación mínima de personas</h2>
      <p className="helper">Registra solo grupos o referencias mínimas. Evita nombres completos, cédulas o datos médicos.</p>
      <div className="stack">
        {personas.map((persona) => <article className={`person ${persona.estado.replace(' ', '-')}`} key={persona.etiqueta}><strong>{persona.etiqueta}</strong><p>{persona.municipio} · {persona.estado}</p><span>{persona.ultimaNota}</span></article>)}
      </div>
    </section>
  )
}

function MiniRow({ title, body, status }: { title: string; body: string; status: string }) {
  return <article className="mini-row"><strong>{title}</strong><p>{body}</p><span>{status}</span></article>
}

function Assignments() {
  return (
    <section className="panel">
      <h2><Truck size={19} /> Tablero de asignaciones</h2>
      <div className="stack">
        {asignaciones.map((item) => <article key={item.id}><strong>{item.casoId} · {item.equipo}</strong><p>{item.responsable} · ETA {item.eta}</p><span className="pill">{item.estado}</span></article>)}
      </div>
      <h2><PackageCheck size={19} /> Solicitudes concretas</h2>
      <div className="stack tight">
        {solicitudes.map((item) => <article key={item.id}><strong>{item.item}</strong><p>{item.casoId} · {item.entregado}/{item.cantidad} · {item.punto}</p><span className="pill">{item.estado}</span></article>)}
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

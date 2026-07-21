import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Award, BookOpen, Check, ChevronRight,
  CircleHelp, Clock3, Cuboid, Eye, Flag, Hand, Home, LockKeyhole, Map,
  Medal, Menu, RotateCcw, Shield, ShieldCheck, Target, Trophy,
  Users, X, Zap,
} from 'lucide-react'
import { dimensions, gameRules, initialProgress, missions } from './gameData'
import type { DimensionId, GameProgress, Mission, MissionState } from './types'
const TerminalMap3D = lazy(() => import('./TerminalMap3D'))
import './App.css'

type View = 'map' | 'mission' | 'rules' | 'dimensions' | 'world'
type Phase = 'briefing' | 'hazards' | 'decision' | 'evidence' | 'certificate' | 'debrief'

const STORAGE_KEY = 'fatalzero-world-cup-progress-v1'
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

const loadProgress = (): GameProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...initialProgress, ...JSON.parse(saved) } : initialProgress
  } catch {
    return initialProgress
  }
}

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'rules', label: 'Como se juega', icon: CircleHelp },
  { id: 'dimensions', label: '9 Dimensiones', icon: Shield },
  { id: 'world', label: 'World Cup', icon: Trophy },
]

const phaseLabels: Record<Phase, string> = {
  briefing: 'Briefing', hazards: 'Exploracion', decision: 'Decision', evidence: 'Evidencia',
  certificate: 'Certificado', debrief: 'Impacto 9D',
}

function Brand() {
  return (
    <button className="brand" type="button" onClick={() => location.reload()} aria-label="FATALZERO, volver al inicio">
      <span className="brand-shield"><ShieldCheck size={23} /></span>
      <span><strong>FATAL<span>ZERO</span></strong><small>WORLD CUP</small></span>
    </button>
  )
}

function App() {
  const [view, setView] = useState<View>('map')
  const [mobileNav, setMobileNav] = useState(false)
  const [progress, setProgress] = useState<GameProgress>(loadProgress)
  const [selectedMission, setSelectedMission] = useState<Mission>(missions[0])
  const [phase, setPhase] = useState<Phase>('briefing')
  const [selectedHazards, setSelectedHazards] = useState<string[]>([])
  const [safeDecision, setSafeDecision] = useState(false)
  const [decisionFeedback, setDecisionFeedback] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [dimensionFocus, setDimensionFocus] = useState<DimensionId>('culture')

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)), [progress])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const completedCount = progress.completed.length
  const globalProgress = Math.round((completedCount / missions.length) * 100)

  const missionState = (mission: Mission): MissionState => {
    if (progress.sustained.includes(mission.id)) return 'sustained'
    if (progress.completed.includes(mission.id)) return 'completed'
    if (view === 'mission' && selectedMission.id === mission.id) return 'active'
    if (mission.order <= completedCount + 1) return 'available'
    return 'locked'
  }

  const phaseIndex = Object.keys(phaseLabels).indexOf(phase)

  const resetMissionState = (mission: Mission) => {
    setSelectedMission(mission)
    setPhase('briefing')
    setSelectedHazards([])
    setSafeDecision(false)
    setDecisionFeedback('')
    setEvidence([])
  }

  const openMission = (mission: Mission) => {
    if (missionState(mission) === 'locked') {
      setToast(`Completa la mision ${mission.order - 1} para desbloquear este desafio.`)
      return
    }
    resetMissionState(mission)
    setView('mission')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chooseDecision = (safe: boolean, feedback: string) => {
    setDecisionFeedback(feedback)
    setSafeDecision(safe)
    if (!safe) setToast('SAFE FAILURE: tarea detenida. Revisa el control critico.')
  }

  const activateStopWork = () => {
    setSafeDecision(true)
    setDecisionFeedback('STOP WORK ACTIVADO. La tarea queda detenida hasta recuperar los controles criticos.')
    setProgress((current) => ({ ...current, reports: current.reports + 1, points: current.points + 25 }))
    setToast('+25 puntos preventivos. Reportar protege a todo el equipo.')
  }

  const issueCertificate = () => {
    if (!evidence.every((item) => selectedMission.evidence.includes(item)) || evidence.length !== selectedMission.evidence.length) return
    const isNew = !progress.completed.includes(selectedMission.id)
    setProgress((current) => ({
      ...current,
      completed: isNew ? [...current.completed, selectedMission.id] : current.completed,
      points: isNew ? current.points + selectedMission.reward : current.points,
      certificates: isNew ? current.certificates + 1 : current.certificates,
    }))
    setPhase('certificate')
    setToast(isNew ? `Certificado emitido. +${selectedMission.reward} puntos cooperativos.` : 'Mision revisada correctamente.')
  }

  const shareLearning = () => {
    setProgress((current) => ({ ...current, collaborations: current.collaborations + 1, points: current.points + 40 }))
    setToast('+40 puntos de colaboracion. El aprendizaje ya puede ayudar a otra cuadrilla.')
  }

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY)
    setProgress(initialProgress)
    resetMissionState(missions[0])
    setView('map')
    setToast('Progreso de demostracion reiniciado.')
  }

  const goTo = (next: View) => {
    setView(next)
    setMobileNav(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <nav className={mobileNav ? 'main-nav is-open' : 'main-nav'} aria-label="Navegacion principal">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? 'active' : ''} type="button" onClick={() => goTo(id)}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
        <div className="player-status">
          <span className="player-avatar">CM</span>
          <span><strong>Carlos Medina</strong><small>Operario de Trinca · Buenos Aires</small></span>
          <span className="points">{progress.points.toLocaleString('es-AR')} pts</span>
        </div>
        <button className="icon-button menu-button" type="button" onClick={() => setMobileNav(!mobileNav)} aria-label="Abrir menu">
          {mobileNav ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        {view === 'map' && (
          <MapView
            progress={progress}
            globalProgress={globalProgress}
            missionState={missionState}
            openMission={openMission}
            setView={goTo}
            reportRisk={() => {
              setProgress((current) => ({ ...current, reports: current.reports + 1, points: current.points + 25 }))
              setToast('+25 puntos preventivos. El reporte fue registrado.')
            }}
          />
        )}
        {view === 'mission' && (
          <MissionPlayer
            mission={selectedMission}
            phase={phase}
            phaseIndex={phaseIndex}
            selectedHazards={selectedHazards}
            safeDecision={safeDecision}
            feedback={decisionFeedback}
            evidence={evidence}
            onBack={() => goTo('map')}
            setPhase={setPhase}
            setSelectedHazards={setSelectedHazards}
            chooseDecision={chooseDecision}
            activateStopWork={activateStopWork}
            setEvidence={setEvidence}
            issueCertificate={issueCertificate}
            shareLearning={shareLearning}
            nextMission={() => {
              const next = missions[selectedMission.order]
              if (next) openMission(next)
              else goTo('world')
            }}
          />
        )}
        {view === 'rules' && <RulesView start={() => openMission(missions[Math.min(completedCount, missions.length - 1)])} />}
        {view === 'dimensions' && <DimensionsView focus={dimensionFocus} setFocus={setDimensionFocus} progress={progress} />}
        {view === 'world' && <WorldView progress={progress} globalProgress={globalProgress} share={shareLearning} />}
      </main>

      <footer>
        <Brand />
        <p>Prototipo educativo. No reemplaza procedimientos, permisos ni validacion HSSE local.</p>
        <div>
          <a href="https://3destinyuser.github.io/hsse-ecosystem-americas/#executive-americas" target="_blank" rel="noreferrer">HSSE Ecosystem</a>
          <a href="https://3destinyuser.github.io/hsse-ecosystem-americas/#academy" target="_blank" rel="noreferrer">Operator Academy</a>
          <button type="button" onClick={resetGame}><RotateCcw size={15} /> Reiniciar demo</button>
        </div>
      </footer>

      {toast && <div className="toast" role="status"><ShieldCheck size={20} /> {toast}</div>}
    </div>
  )
}

interface MapViewProps {
  progress: GameProgress
  globalProgress: number
  missionState: (mission: Mission) => MissionState
  openMission: (mission: Mission) => void
  setView: (view: View) => void
  reportRisk: () => void
}

function MapView({ progress, globalProgress, missionState, openMission, setView, reportRisk }: MapViewProps) {
  const [mapMode, setMapMode] = useState<'3d' | '2d'>('3d')
  const nextMission = missions.find((mission) => missionState(mission) === 'available') ?? missions[0]
  return (
    <>
      <section className="command-hero">
        <div className="hero-media"><img src={asset('root-portal.png')} alt="Terminal portuaria FATALZERO" /></div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <span className="eyebrow">Campana 01 · Trinca y Destrinca Segura</span>
          <h1>Conoce el <em>pasado</em>.<br />Controla el <strong>presente</strong>.<br />Predice el <b>futuro</b>.</h1>
          <p>No competimos para ocultar incidentes. Competimos para detectar antes, colaborar mejor y proteger mas vidas.</p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={() => openMission(nextMission)}><Zap size={19} /> Jugar mision {nextMission.order}</button>
            <button className="secondary" type="button" onClick={() => setView('rules')}><BookOpen size={19} /> Ver reglas</button>
          </div>
        </div>
        <aside className="mission-now">
          <span className="status-dot" />
          <div><small>MISION DISPONIBLE</small><strong>{nextMission.title}</strong><span>{nextMission.duration} · {nextMission.reward} pts</span></div>
          <button className="icon-button" onClick={() => openMission(nextMission)} aria-label={`Abrir ${nextMission.title}`}><ChevronRight /></button>
        </aside>
        <div className="hero-metrics">
          <span><strong>{progress.completed.length}/8</strong> zonas verdes</span>
          <span><strong>{progress.certificates}</strong> certificados</span>
          <span><strong>{progress.reports}</strong> riesgos reportados</span>
          <span><strong>{globalProgress}%</strong> campana</span>
        </div>
      </section>

      <section className="map-section" aria-labelledby="map-title">
        <div className="section-heading">
          <div><span className="eyebrow">AGE Z · Mapa de campana</span><h2 id="map-title">Convierte cada zona roja en una capacidad demostrada.</h2></div>
          <div className="map-heading-actions">
            <div className="state-legend"><span className="red">Bloqueada</span><span className="amber">Disponible</span><span className="green">Certificada</span></div>
            <div className="map-mode-switch" aria-label="Modo de visualizacion">
              <button className={mapMode === '3d' ? 'active' : ''} type="button" onClick={() => setMapMode('3d')}><Cuboid /> 3D</button>
              <button className={mapMode === '2d' ? 'active' : ''} type="button" onClick={() => setMapMode('2d')}><Map /> 2D</button>
            </div>
          </div>
        </div>
        <div className="map-layout">
          <div className={`terminal-map ${mapMode === '3d' ? 'three-mode' : ''}`}>
            {mapMode === '3d' ? (
              <Suspense fallback={<div className="map-3d-loading" role="status"><span>3D</span><small>Preparando visor interactivo</small></div>}>
                <TerminalMap3D missions={missions} missionState={missionState} openMission={openMission} />
              </Suspense>
            ) : (
              <>
                <img src={asset('age-z-map.png')} alt="Mapa conceptual de una terminal con zonas bloqueadas y seguras" />
                <div className="map-overlay" />
                {missions.map((mission) => {
                  const state = missionState(mission)
                  return (
                    <button
                      key={mission.id}
                      className={`hotspot ${state}`}
                      style={{ left: `${mission.mapPosition.x}%`, top: `${mission.mapPosition.y}%` }}
                      onClick={() => openMission(mission)}
                      aria-label={`${mission.title}. Estado: ${state}`}
                      title={mission.title}
                    >
                      {state === 'locked' ? <LockKeyhole /> : state === 'completed' || state === 'sustained' ? <Check /> : <Target />}
                      <span>{mission.order}</span>
                    </button>
                  )
                })}
              </>
            )}
            <div className="map-caption"><Cuboid size={18} /> APM Terminals Buenos Aires <small>Real 3D model · Prototype interactions</small></div>
          </div>
          <aside className="campaign-list" aria-label="Misiones de la campana">
            <div className="campaign-list-header"><span>RUTA ASIGNADA</span><strong>{progress.completed.length} de 8 completas</strong></div>
            {missions.map((mission) => {
              const state = missionState(mission)
              return (
                <button key={mission.id} type="button" onClick={() => openMission(mission)} className={`mission-row ${state}`}>
                  <span className="mission-index">{String(mission.order).padStart(2, '0')}</span>
                  <span><strong>{mission.shortTitle}</strong><small>{mission.subtitle}</small></span>
                  <span className="mission-state">{state === 'locked' ? <LockKeyhole /> : state === 'completed' || state === 'sustained' ? <ShieldCheck /> : <ArrowRight />}</span>
                </button>
              )
            })}
            <button className="report-button" type="button" onClick={reportRisk}><AlertTriangle size={18} /> Reportar riesgo observado <span>+25 pts</span></button>
          </aside>
        </div>
      </section>

      <section className="why-world">
        <div><span className="eyebrow">¿Por que un Mundial?</span><h2>Porque el riesgo es local, pero el aprendizaje puede proteger al mundo.</h2></div>
        <div className="why-steps">
          <article><span>01</span><Users /><strong>Colaborar</strong><p>Las cuadrillas comparten hallazgos, controles y buenas practicas.</p></article>
          <article><span>02</span><Medal /><strong>Certificar</strong><p>El progreso requiere competencia demostrada y evidencia validada.</p></article>
          <article><span>03</span><Trophy /><strong>Ganar juntos</strong><p>Las terminales avanzan cuando sostienen controles, no cuando ocultan reportes.</p></article>
        </div>
      </section>
    </>
  )
}

interface PlayerProps {
  mission: Mission; phase: Phase; phaseIndex: number; selectedHazards: string[]; safeDecision: boolean
  feedback: string; evidence: string[]; onBack: () => void; setPhase: (phase: Phase) => void
  setSelectedHazards: (value: string[]) => void; chooseDecision: (safe: boolean, feedback: string) => void
  activateStopWork: () => void; setEvidence: (value: string[]) => void; issueCertificate: () => void
  shareLearning: () => void; nextMission: () => void
}

function MissionPlayer(props: PlayerProps) {
  const { mission, phase, phaseIndex } = props
  const hazardsReady = mission.requiredHazards.every((id) => props.selectedHazards.includes(id))
  const evidenceReady = mission.evidence.every((item) => props.evidence.includes(item))

  const toggle = (value: string, list: string[], setList: (items: string[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  return (
    <section className="mission-player">
      <header className="mission-header">
        <button className="back-button" type="button" onClick={props.onBack}><ArrowLeft /> Volver al mapa</button>
        <div><span className="eyebrow">Mision {String(mission.order).padStart(2, '0')} · FATAL 5</span><h1>{mission.title}</h1><p>{mission.subtitle}</p></div>
        <div className="mission-reward"><Award /><span><small>RECOMPENSA</small><strong>+{mission.reward} pts</strong></span></div>
      </header>

      <div className="phase-track" aria-label="Progreso de la mision">
        {Object.entries(phaseLabels).map(([id, label], index) => (
          <span key={id} className={index < phaseIndex ? 'done' : index === phaseIndex ? 'active' : ''}>
            <i>{index < phaseIndex ? <Check /> : index + 1}</i><b>{label}</b>
          </span>
        ))}
      </div>

      <div className="mission-stage">
        <div className="mission-visual">
          <img src={mission.image} alt={`Escenario de ${mission.title}`} />
          <div className="visual-shade" />
          <span className="visual-tag"><Clock3 /> {mission.duration}</span>
          {phase === 'hazards' && <div className="scan-line" />}
          {(phase === 'decision' || phase === 'evidence') && <div className="danger-zone"><AlertTriangle /> Control critico</div>}
        </div>

        <div className="mission-panel">
          {phase === 'briefing' && (
            <div className="panel-content">
              <span className="panel-kicker"><BookOpen /> CONOCE EL PASADO</span>
              <h2>{mission.objective}</h2>
              <p>{mission.briefing}</p>
              <div className="briefing-rule"><Shield /><span><strong>Regla de oro</strong>Si falta un control critico, la tarea no comienza.</span></div>
              <button className="primary wide" onClick={() => props.setPhase('hazards')}>Explorar escenario <ArrowRight /></button>
            </div>
          )}

          {phase === 'hazards' && (
            <div className="panel-content">
              <span className="panel-kicker"><Eye /> EXPLORA</span>
              <h2>Identifica los tres riesgos que requieren control.</h2>
              <p>Selecciona todos los riesgos relevantes. Detectar antes es parte de la competencia.</p>
              <div className="option-list">
                {mission.hazards.map((hazard) => (
                  <button key={hazard.id} className={props.selectedHazards.includes(hazard.id) ? 'selected' : ''} onClick={() => toggle(hazard.id, props.selectedHazards, props.setSelectedHazards)}>
                    <span>{props.selectedHazards.includes(hazard.id) ? <Check /> : <Target />}</span>{hazard.label}
                  </button>
                ))}
              </div>
              <button className="primary wide" disabled={!hazardsReady} onClick={() => props.setPhase('decision')}>Confirmar riesgos <ArrowRight /></button>
            </div>
          )}

          {phase === 'decision' && (
            <div className="panel-content">
              <span className="panel-kicker"><Zap /> DECIDE</span>
              <h2>¿Que haces antes de continuar?</h2>
              <p>La velocidad no suma puntos. Selecciona la accion que controla realmente la exposicion.</p>
              <div className="option-list decisions">
                {mission.decisions.map((decision) => (
                  <button key={decision.id} className={props.feedback === decision.feedback ? decision.safe ? 'selected safe' : 'selected unsafe' : ''} onClick={() => props.chooseDecision(decision.safe, decision.feedback)}>
                    <span>{decision.safe ? <ShieldCheck /> : <AlertTriangle />}</span>{decision.label}
                  </button>
                ))}
              </div>
              {props.feedback && <div className={props.safeDecision ? 'feedback safe' : 'feedback unsafe'}>{props.feedback}</div>}
              <div className="decision-actions">
                <button className="stop-work" type="button" onClick={props.activateStopWork}><Hand /> STOP WORK</button>
                <button className="primary" disabled={!props.safeDecision} onClick={() => props.setPhase('evidence')}>Registrar evidencia <ArrowRight /></button>
              </div>
            </div>
          )}

          {phase === 'evidence' && (
            <div className="panel-content">
              <span className="panel-kicker"><ShieldCheck /> DEMUESTRA</span>
              <h2>La decision necesita evidencia verificable.</h2>
              <p>Simula la revision del supervisor. Una trivia no certifica competencia.</p>
              <div className="evidence-list">
                {mission.evidence.map((item) => (
                  <label key={item} className={props.evidence.includes(item) ? 'checked' : ''}>
                    <input type="checkbox" checked={props.evidence.includes(item)} onChange={() => toggle(item, props.evidence, props.setEvidence)} />
                    <span><Check /></span><b>{item}</b><small>Validacion simulada</small>
                  </label>
                ))}
              </div>
              <div className="validator"><span className="player-avatar">JP</span><span><small>VALIDADOR ASIGNADO</small><strong>Juan Perez · Supervisor competente</strong></span><ShieldCheck /></div>
              <button className="primary wide" disabled={!evidenceReady} onClick={props.issueCertificate}>Validar competencia <Award /></button>
            </div>
          )}

          {phase === 'certificate' && (
            <div className="certificate-wrap">
              <div className="certificate">
                <div className="certificate-brand"><ShieldCheck /> FATALZERO WORLD CUP</div>
                <span>CERTIFICADO DE APRENDIZAJE</span>
                <h2>{mission.certificate}</h2>
                <p>Otorgado a</p><strong>Carlos Medina</strong>
                <small>por completar la mision {mission.order}: {mission.title}</small>
                <div className="certificate-seal"><Medal /></div>
                <div className="certificate-meta"><span>Terminal Callao</span><span>Prototipo educativo</span><span>FZ-{mission.order}2026</span></div>
              </div>
              <p className="certificate-note">Este reconocimiento no sustituye permisos, habilitaciones ni validacion HSSE local.</p>
              <button className="primary wide" onClick={() => props.setPhase('debrief')}>Ver impacto en las 9D <ArrowRight /></button>
            </div>
          )}

          {phase === 'debrief' && (
            <div className="panel-content">
              <span className="panel-kicker"><Shield /> CONTROLA EL PRESENTE</span>
              <h2>Tu accion fortalecio {mission.dimensions.length} dimensiones.</h2>
              <p>El resultado no queda aislado: se convierte en capacidad, evidencia y aprendizaje reutilizable.</p>
              <div className="debrief-grid">
                {mission.dimensions.map((id) => <DimensionChip key={id} id={id} />)}
              </div>
              <div className="world-contribution"><Trophy /><span><small>APORTE WORLD CUP</small><strong>+{mission.reward} puntos · 1 zona convertida a verde</strong></span></div>
              <div className="decision-actions">
                <button className="secondary" onClick={props.shareLearning}><Users /> Compartir aprendizaje</button>
                <button className="primary" onClick={props.nextMission}>Siguiente mision <ArrowRight /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DimensionChip({ id }: { id: DimensionId }) {
  const dimension = dimensions[id]
  return <div className="dimension-chip"><span>{dimension.number}</span><div><strong>{dimension.name}</strong><small>{dimension.value}</small></div></div>
}

function RulesView({ start }: { start: () => void }) {
  const flow = [
    ['Explora', 'Selecciona una zona roja y conoce el caso.', Map],
    ['Detecta', 'Identifica peligros y controles criticos.', Eye],
    ['Decide', 'Elige una accion segura o activa Stop Work.', Target],
    ['Demuestra', 'Registra evidencia y recibe validacion.', ShieldCheck],
    ['Certifica', 'Desbloquea la zona y comparte la leccion.', Award],
  ] as const
  return (
    <section className="content-view rules-view">
      <div className="page-hero rules-hero">
        <div><span className="eyebrow">Reglas del juego educativo</span><h1>Jugar es practicar decisiones que protegen vidas.</h1><p>AGE Z convierte aprendizajes del pasado en misiones. Las 9D transforman esas decisiones en control. World Cup escala el aprendizaje entre terminales.</p><button className="primary" onClick={start}><Zap /> Iniciar campana</button></div>
        <img src={asset('fatalzero-overview.png')} alt="Resumen visual de FATALZERO World Cup" />
      </div>
      <div className="how-flow">
        {flow.map(([title, copy, Icon], index) => <article key={title}><span>{index + 1}</span><Icon /><strong>{title}</strong><p>{copy}</p>{index < flow.length - 1 && <ArrowRight className="flow-arrow" />}</article>)}
      </div>
      <div className="rules-layout">
        <div><span className="eyebrow">10 reglas no negociables</span><h2>La competencia nunca puede crear un incentivo inseguro.</h2></div>
        <ol>{gameRules.map((rule, index) => <li key={rule}><span>{String(index + 1).padStart(2, '0')}</span>{rule}</li>)}</ol>
      </div>
      <div className="score-model">
        <div><span className="eyebrow">Competencia cooperativa</span><h2>Se reconoce la contribucion, no la ausencia artificial de reportes.</h2></div>
        {[['Competencia demostrada', 30], ['Prevencion verificada', 25], ['Colaboracion y mentoria', 20], ['Controles sostenidos', 15], ['Conocimiento compartido', 10]].map(([label, value]) => <div className="score-row" key={String(label)}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></div>)}
      </div>
    </section>
  )
}

function DimensionsView({ focus, setFocus, progress }: { focus: DimensionId; setFocus: (id: DimensionId) => void; progress: GameProgress }) {
  const contribution = useMemo(() => {
    const counts = {} as Record<DimensionId, number>
    Object.keys(dimensions).forEach((id) => { counts[id as DimensionId] = 0 })
    missions.filter((mission) => progress.completed.includes(mission.id)).forEach((mission) => mission.dimensions.forEach((id) => { counts[id] += 1 }))
    return counts
  }, [progress.completed])
  return (
    <section className="content-view dimensions-view">
      <div className="page-hero dimensions-hero">
        <div><span className="eyebrow">HSSEcosystem+ · Presente</span><h1>Una mision. Multiples capacidades.</h1><p>Las dimensiones no son menus separados. Cada decision segura alimenta el sistema con conducta, competencia, evidencia y aprendizaje.</p></div>
        <img src={asset('hsse-9d.png')} alt="Las nueve dimensiones del ecosistema HSSE" />
      </div>
      <div className="dimension-console">
        <div className="dimension-wheel">
          <div className="wheel-center"><strong>9D</strong><span>CONTROL DEL PRESENTE</span></div>
          {(Object.keys(dimensions) as DimensionId[]).map((id, index) => {
            const angle = (index / 9) * 360 - 90
            const style = { '--angle': `${angle}deg` } as React.CSSProperties
            return <button key={id} style={style} className={focus === id ? 'active' : ''} onClick={() => setFocus(id)}><span>{dimensions[id].number}</span></button>
          })}
        </div>
        <div className="dimension-readout">
          <span className="eyebrow">Dimension {dimensions[focus].number}</span>
          <h2>{dimensions[focus].name}</h2><p>{dimensions[focus].value}</p>
          <div className="readout-stat"><strong>{contribution[focus]}</strong><span>misiones completadas aportaron evidencia a esta dimension</span></div>
          <div className="dimension-progress"><i><b style={{ width: `${Math.min(100, contribution[focus] * 24)}%` }} /></i><span>{Math.min(100, contribution[focus] * 24)}%</span></div>
        </div>
      </div>
      <div className="dimension-list">{(Object.keys(dimensions) as DimensionId[]).map((id) => <button key={id} onClick={() => setFocus(id)} className={focus === id ? 'active' : ''}><span>{dimensions[id].number}</span><strong>{dimensions[id].name}</strong><small>{dimensions[id].value}</small><b>{contribution[id]} aportes</b></button>)}</div>
    </section>
  )
}

function WorldView({ progress, globalProgress, share }: { progress: GameProgress; globalProgress: number; share: () => void }) {
  const safeContribution = Math.min(99, 58 + Math.round(globalProgress * 0.18))
  return (
    <section className="content-view world-view">
      <div className="page-hero world-hero">
        <div><span className="eyebrow">Predice · World Cup · Futuro</span><h1>El Mundial convierte aprendizajes locales en una victoria compartida.</h1><p>Cada terminal compite por demostrar competencia, colaborar y sostener controles. El objetivo no es derrotar a otra terminal: es que ninguna quede atras.</p><button className="primary" onClick={share}><Users /> Compartir aprendizaje +40 pts</button></div>
        <img src={asset('world-cup.png')} alt="Mapa global de la FATALZERO World Cup" />
      </div>
      <div className="world-stats">
        <article><Trophy /><span><small>PROGRESO GLOBAL</small><strong>{safeContribution}%</strong></span></article>
        <article><Award /><span><small>TUS CERTIFICADOS</small><strong>{progress.certificates}</strong></span></article>
        <article><Users /><span><small>COLABORACIONES</small><strong>{progress.collaborations}</strong></span></article>
        <article><Flag /><span><small>CAMPANA TRINCA</small><strong>{globalProgress}%</strong></span></article>
      </div>
      <div className="world-grid">
        <div className="world-map-panel"><img src={asset('world-cup.png')} alt="Red mundial de terminales participantes" /><div className="world-map-overlay"><span>Illustrative prototype data</span><strong>Conocimiento que viaja. Controles que se fortalecen.</strong></div></div>
        <div className="ranking-panel"><span className="eyebrow">Ranking de contribucion</span><h2>Terminales que comparten para avanzar.</h2>{[
          ['01', 'APM Terminals Callao', 'Americas', '12.450'],
          ['02', 'Brasil Terminal Portuario', 'Americas', '11.980'],
          ['03', 'APM Terminals Moin', 'Americas', '11.620'],
          ['08', 'Tu cuadrilla · Callao', 'Trinca B', progress.points.toLocaleString('es-AR')],
        ].map(([rank, name, region, points]) => <div className={rank === '08' ? 'rank-row player' : 'rank-row'} key={name}><strong>{rank}</strong><span><b>{name}</b><small>{region}</small></span><em>{points} pts</em></div>)}</div>
      </div>
      <div className="five-years"><span className="eyebrow">El camino de cinco anos</span><h2>Del FATAL 5 al FATAL ZERO.</h2><div>{[['2027', 'FATAL 5', 'Fundar la memoria'], ['2028', 'FATAL 4', 'Entrenar capacidades'], ['2029', 'FATAL 3', 'Anticipar riesgos'], ['2030', 'FATAL 2', 'Medir y cooperar'], ['2031', 'FATAL ZERO', 'Sostener y liderar']].map(([year, fatal, goal], index) => <article key={year}><span>{year}</span><strong>{fatal}</strong><p>{goal}</p><i className={index === 0 ? 'active' : ''} /></article>)}</div></div>
    </section>
  )
}

export default App

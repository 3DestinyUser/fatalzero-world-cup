import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Award, BookOpen, Check, ChevronRight,
  CircleHelp, Clock3, Crown, Cuboid, Eye, Flag, Gamepad2, Hand, Home,
  LockKeyhole, Map, Medal, Menu, Monitor, RotateCcw, ScanLine, Shield,
  ShieldCheck, Smartphone, Swords, Target, Trophy, Users, X, Zap,
} from 'lucide-react'
import { activeRole, challenges, dimensions, gameRules, initialProgress, missions } from './gameData'
import type {
  Challenge, DimensionId, GameProgress, Mission, MissionState, PPEId, RoleProfile, SimulatorEvent,
} from './types'
import ARScanner from './ARScanner'
import VI3WCommunicator, { type VI3WContext } from './VI3WCommunicator'
import SimulatorExperience from './SimulatorExperience'
const TerminalMap3D = lazy(() => import('./TerminalMap3D'))
import './App.css'

type View = 'map' | 'mission' | 'challenges' | 'rules' | 'dimensions' | 'world'
type Phase = 'briefing' | 'scan' | 'hazards' | 'simulation' | 'decision' | 'evidence' | 'certificate' | 'debrief'

const STORAGE_KEY = 'fatalzero-world-cup-progress-v1'
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

const loadProgress = (): GameProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialProgress
    const parsed = JSON.parse(saved) as Partial<GameProgress>
    return {
      ...initialProgress,
      ...parsed,
      sharedMissions: parsed.sharedMissions ?? [],
      acceptedChallenges: parsed.acceptedChallenges ?? [],
      completedChallenges: parsed.completedChallenges ?? [],
      unlockedBadges: parsed.unlockedBadges ?? [],
      scans: parsed.scans ?? 0,
      simulationsCompleted: parsed.simulationsCompleted ?? 0,
      safeFailures: parsed.safeFailures ?? 0,
    }
  } catch {
    return initialProgress
  }
}

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'challenges', label: 'Desafios', icon: Swords },
  { id: 'rules', label: 'Como se juega', icon: CircleHelp },
  { id: 'dimensions', label: '9 Dimensiones', icon: Shield },
  { id: 'world', label: 'World Cup', icon: Trophy },
]

const phaseLabels: Record<Phase, string> = {
  briefing: 'Briefing', scan: 'Field Scan', hazards: 'Confirmacion', simulation: 'Simulador', decision: 'Decision', evidence: 'Evidencia',
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
  const [scanComplete, setScanComplete] = useState(false)
  const [selectedPpe, setSelectedPpe] = useState<PPEId[]>([])
  const [simulationComplete, setSimulationComplete] = useState(false)
  const [simulatorEvents, setSimulatorEvents] = useState<SimulatorEvent[]>([])
  const [toast, setToast] = useState('')
  const [dimensionFocus, setDimensionFocus] = useState<DimensionId>('culture')

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)), [progress])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [view, selectedMission.id, phase])

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({
      coordinateSystem: '3D: model-centered X/Z plane with Y up. 2D: top-left origin, x right, y down.',
      view,
      player: { name: 'Carlos Medina', role: activeRole.name, terminal: activeRole.terminal },
      mission: view === 'mission' ? {
        id: selectedMission.id,
        title: selectedMission.title,
        phase,
        hazardsSelected: selectedHazards,
        requiredHazards: selectedMission.requiredHazards,
        ppeSelected: selectedPpe,
        requiredPpe: selectedMission.requiredPpe,
        scanComplete,
        simulationRequired: Boolean(selectedMission.simulation),
        simulationComplete,
        simulatorEvents: simulatorEvents.slice(-6),
        safeDecision,
        evidenceSelected: evidence,
      } : null,
      map: missions.map((mission) => ({ id: mission.id, order: mission.order, state: missionState(mission) })),
      progress,
    })
    window.advanceTime = () => { /* The prototype has no time-based scoring or simulation state. */ }
    return () => {
      delete window.render_game_to_text
      delete window.advanceTime
    }
  })

  const completedCount = progress.completed.length
  const globalProgress = Math.round((completedCount / missions.length) * 100)
  const playerLevel = 7 + Math.floor(Math.max(0, progress.points - initialProgress.points) / 600)

  const missionState = (mission: Mission): MissionState => {
    if (!mission.applicableRoles.includes(activeRole.id)) return 'not-applicable'
    if (progress.sustained.includes(mission.id)) return 'sustained'
    if (progress.completed.includes(mission.id)) return 'completed'
    if (view === 'mission' && selectedMission.id === mission.id) return 'active'
    if (mission.order <= completedCount + 1) return 'available'
    return 'locked'
  }


  const resetMissionState = (mission: Mission) => {
    setSelectedMission(mission)
    setPhase('briefing')
    setSelectedHazards([])
    setSafeDecision(false)
    setDecisionFeedback('')
    setEvidence([])
    setScanComplete(false)
    setSelectedPpe([])
    setSimulationComplete(false)
    setSimulatorEvents([])
  }

  const openMission = (mission: Mission) => {
    if (!mission.applicableRoles.includes(activeRole.id)) {
      setToast('Esta mision no corresponde a tu rol. Consulta a tu supervisor para otra ruta.')
      return
    }
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

  const completeFieldScan = () => {
    if (!scanComplete) setProgress((current) => ({ ...current, scans: current.scans + 1 }))
    setScanComplete(true)
  }

  const handleSimulatorEvent = useCallback((event: SimulatorEvent) => {
    setSimulatorEvents((current) => [...current, event].slice(-12))
    if (event.type === 'safe_failure') {
      setProgress((current) => ({ ...current, safeFailures: current.safeFailures + 1 }))
      setToast('SAFE FAILURE: el simulador detuvo la accion y mantuvo el control actual.')
    }
  }, [])

  const completeSimulation = () => {
    if (!simulationComplete) {
      setProgress((current) => ({
        ...current,
        simulationsCompleted: current.simulationsCompleted + 1,
      }))
    }
    setSimulationComplete(true)
    setPhase('decision')
    setToast('Simulacion transferida a FATALZERO. Ahora confirma la decision operacional.')
  }

  const issueCertificate = () => {
    if (!evidence.every((item) => selectedMission.evidence.includes(item)) || evidence.length !== selectedMission.evidence.length) return
    const isNew = !progress.completed.includes(selectedMission.id)
    const activeChallenge = challenges.find((challenge) => (
      challenge.missionId === selectedMission.id
      && progress.acceptedChallenges.includes(challenge.id)
      && !progress.completedChallenges.includes(challenge.id)
    ))
    setProgress((current) => ({
      ...current,
      completed: isNew ? [...current.completed, selectedMission.id] : current.completed,
      points: current.points + (isNew ? selectedMission.reward : 0) + (activeChallenge?.reward ?? 0),
      certificates: isNew ? current.certificates + 1 : current.certificates,
      collaborations: activeChallenge ? current.collaborations + 1 : current.collaborations,
      completedChallenges: activeChallenge ? [...current.completedChallenges, activeChallenge.id] : current.completedChallenges,
      unlockedBadges: activeChallenge ? [...new Set([...current.unlockedBadges, activeChallenge.badge])] : current.unlockedBadges,
    }))
    setPhase('certificate')
    if (activeChallenge) setToast(`Mision y desafio completados. +${selectedMission.reward + activeChallenge.reward} puntos cooperativos.`)
    else setToast(isNew ? `Certificado emitido. +${selectedMission.reward} puntos cooperativos.` : 'Mision revisada correctamente.')
  }

  const acceptChallenge = (challenge: Challenge) => {
    const challengeMission = missions.find((mission) => mission.id === challenge.missionId)
    if (!challengeMission) return
    if (missionState(challengeMission) === 'locked') {
      setToast(`Este desafio se habilita al completar la mision ${challengeMission.order - 1}.`)
      return
    }
    setProgress((current) => ({
      ...current,
      acceptedChallenges: current.acceptedChallenges.includes(challenge.id)
        ? current.acceptedChallenges
        : [...current.acceptedChallenges, challenge.id],
    }))
    setToast(`Desafio aceptado: ${challenge.title}. La seguridad se mide por calidad, no por velocidad.`)
    openMission(challengeMission)
  }

  const shareLearning = (missionId?: string) => {
    if (missionId && progress.sharedMissions.includes(missionId)) {
      setToast('Este aprendizaje ya fue compartido con otra cuadrilla.')
      return
    }
    setProgress((current) => ({
      ...current,
      collaborations: current.collaborations + 1,
      points: current.points + 40,
      sharedMissions: missionId ? [...current.sharedMissions, missionId] : current.sharedMissions,
    }))
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

  const vi3wContext = useMemo<VI3WContext>(() => {
    const nextMission = completedCount < missions.length ? missions[completedCount] : undefined

    if (view === 'mission') {
      const phaseContext: Record<Phase, Omit<VI3WContext, 'id' | 'section'>> = {
        briefing: {
          title: selectedMission.title,
          summary: selectedMission.briefing,
          challenge: selectedMission.objective,
          priority: 'normal',
        },
        scan: {
          title: 'Field Scan · Preparar antes de decidir',
          summary: scanComplete
            ? `Escaneo confirmado. Seleccionaste ${selectedPpe.length} elementos del kit de campo.`
            : 'El escaneo conecta la escena, el EPP y los controles críticos antes de exponer a la persona.',
          challenge: 'Completá el escaneo y verificá el kit requerido para esta tarea.',
          priority: 'high',
        },
        hazards: {
          title: 'Confirmar peligros y controles',
          summary: `Marcaste ${selectedHazards.length} señales. La misión requiere reconocer ${selectedMission.requiredHazards.length} peligros críticos.`,
          challenge: 'Separá las señales que cambian la decisión de los datos que sólo describen la escena.',
          priority: 'high',
        },
        simulation: {
          title: 'Simulador Unity · Práctica espacial',
          summary: simulationComplete
            ? 'La práctica fue transferida a FATALZERO y espera confirmación operacional.'
            : `Unity está evaluando controles críticos para ${selectedMission.title}. La velocidad no entrega puntos.`,
          challenge: simulationComplete
            ? 'Confirmá la decisión operacional y registrá evidencia.'
            : 'Completá los controles o activá Stop Work ante cualquier duda.',
          priority: simulationComplete ? 'normal' : 'high',
        },
        decision: {
          title: safeDecision ? 'Decisión segura seleccionada' : 'La tarea espera una decisión',
          summary: decisionFeedback || 'Podés controlar la exposición o activar Stop Work. La velocidad nunca entrega puntos.',
          challenge: safeDecision ? 'Registrá evidencia verificable de la barrera.' : 'Elegí una acción que elimine o controle la exposición.',
          priority: decisionFeedback && !safeDecision ? 'critical' : 'high',
        },
        evidence: {
          title: 'La decisión necesita evidencia',
          summary: `Registraste ${evidence.length} de ${selectedMission.evidence.length} evidencias requeridas para validar competencia.`,
          challenge: 'Completá la evidencia y dejá que el supervisor valide la competencia.',
          priority: 'normal',
        },
        certificate: {
          title: `Certificado · ${selectedMission.certificate}`,
          summary: `La misión ${selectedMission.order} quedó demostrada con evidencia y aporta ${selectedMission.reward} puntos cooperativos.`,
          challenge: 'Revisá cómo esta acción fortalece las nueve dimensiones.',
          priority: 'normal',
        },
        debrief: {
          title: 'La acción segura se convierte en aprendizaje',
          summary: `${selectedMission.primaryDimensions.length} capacidades directas y ${selectedMission.supportingDimensions.length} dimensiones de soporte recibieron evidencia.`,
          challenge: 'Compartí la lección con otra cuadrilla o avanzá a la siguiente misión.',
          priority: 'normal',
        },
      }
      const current = phaseContext[phase]
      return {
        id: `mission:${selectedMission.id}:${phase}:${selectedHazards.length}:${evidence.length}:${safeDecision}:${simulatorEvents.length}`,
        section: `Misión ${selectedMission.order} · ${phaseLabels[phase]}`,
        ...current,
      }
    }

    if (view === 'challenges') {
      const active = progress.acceptedChallenges.length - progress.completedChallenges.length
      return {
        id: `challenges:${active}:${progress.completedChallenges.length}`,
        section: 'Desafíos semanales',
        title: active > 0 ? `${active} desafío${active === 1 ? '' : 's'} en progreso` : 'La seguridad también se construye en equipo',
        summary: `${progress.completedChallenges.length} desafíos logrados. Las invitaciones reconocen detección, competencia y ayuda; nunca velocidad.`,
        challenge: 'Elegí una misión disponible y convertí una acción segura en protección colectiva.',
        priority: 'normal',
      }
    }

    if (view === 'rules') {
      return {
        id: 'rules',
        section: 'Cómo se juega',
        title: 'Diez reglas protegen la competencia',
        summary: 'Se premian competencia, prevención, colaboración, controles sostenidos y conocimiento compartido.',
        challenge: 'Recordá la regla central: reportar suma; ocultar una señal nunca beneficia.',
        priority: 'normal',
      }
    }

    if (view === 'dimensions') {
      const dimension = dimensions[dimensionFocus]
      return {
        id: `dimension:${dimensionFocus}`,
        section: `9D · Dimensión ${dimension.number}`,
        title: dimension.name,
        summary: dimension.value,
        challenge: 'Seguí la evidencia de una misión y verificá qué otras dimensiones conecta.',
        priority: 'normal',
      }
    }

    if (view === 'world') {
      return {
        id: `world:${globalProgress}:${progress.collaborations}`,
        section: 'FATALZERO World Cup',
        title: 'El aprendizaje local escala al mundo',
        summary: `Campaña al ${globalProgress}%, ${progress.certificates} certificados y ${progress.collaborations} colaboraciones registradas.`,
        challenge: 'Compartí un aprendizaje para que otra terminal pueda fortalecer el mismo control.',
        priority: 'normal',
      }
    }

    return {
      id: `map:${completedCount}:${progress.reports}:${progress.scans}`,
      section: 'AGE Z · Mapa de campaña',
      title: nextMission ? `Próxima misión: ${nextMission.title}` : 'Campaña completada',
      summary: `${completedCount}/8 zonas certificadas, ${progress.reports} riesgos reportados y ${progress.scans} escaneos de campo.`,
      challenge: nextMission?.objective ?? 'Sostené los controles y compartí el aprendizaje.',
      priority: completedCount === 0 ? 'high' : 'normal',
    }
  }, [
    completedCount,
    decisionFeedback,
    dimensionFocus,
    evidence.length,
    globalProgress,
    phase,
    progress.acceptedChallenges.length,
    progress.certificates,
    progress.collaborations,
    progress.completedChallenges.length,
    progress.reports,
    progress.scans,
    safeDecision,
    scanComplete,
    selectedHazards.length,
    selectedMission,
    selectedPpe.length,
    simulationComplete,
    simulatorEvents.length,
    view,
  ])

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
          <span><strong>Carlos Medina</strong><small>Operario de Trinca · Nivel {playerLevel}</small></span>
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
            role={activeRole}
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
            scanComplete={scanComplete}
            selectedPpe={selectedPpe}
            completeFieldScan={completeFieldScan}
            onSimulatorEvent={handleSimulatorEvent}
            completeSimulation={completeSimulation}
            togglePpe={(id) => setSelectedPpe((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
            issueCertificate={issueCertificate}
            shareLearning={() => shareLearning(selectedMission.id)}
            role={activeRole}
            nextMission={() => {
              const next = missions[selectedMission.order]
              if (next) openMission(next)
              else goTo('world')
            }}
          />
        )}
        {view === 'challenges' && (
          <ChallengesView
            progress={progress}
            missionState={missionState}
            acceptChallenge={acceptChallenge}
            openMission={openMission}
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

      <VI3WCommunicator context={vi3wContext} progress={progress} toast={toast} challenges={challenges} />
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
  role: RoleProfile
  reportRisk: () => void
}

function MapView({ progress, globalProgress, missionState, openMission, setView, role, reportRisk }: MapViewProps) {
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
            <button className="secondary" type="button" onClick={() => setView('challenges')}><Swords size={19} /> Desafiar al equipo</button>
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
          <span><strong>{progress.scans}</strong> escaneos de campo</span>
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
        <div className="role-route" aria-label="Ruta de aprendizaje asignada">
          <div className="role-route-heading"><span className="eyebrow">RUTA POR ROL</span><strong>{role.name}</strong><small>{role.terminal} · {role.campaign} · {role.visibleDimensions.length} dimensiones de ruta · {role.informationalDimensions.length} informativas</small></div>
          <div className="role-route-groups">
            <div><span>MODULOS OBLIGATORIOS</span><div>{role.mandatoryModules.map((module) => <b key={module}>{module}</b>)}</div></div>
            <div><span>CONDICIONALES</span><div>{role.conditionalModules.map((module) => <b className="conditional" key={module}>{module}</b>)}</div></div>
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
                      {state === 'not-applicable' ? <X /> : state === 'locked' ? <LockKeyhole /> : state === 'completed' || state === 'sustained' ? <Check /> : <Target />}
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
                  <span className="mission-state">{state === 'not-applicable' ? <X /> : state === 'locked' ? <LockKeyhole /> : state === 'completed' || state === 'sustained' ? <ShieldCheck /> : <ArrowRight />}</span>
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
  mission: Mission; phase: Phase; selectedHazards: string[]; safeDecision: boolean
  feedback: string; evidence: string[]; onBack: () => void; setPhase: (phase: Phase) => void
  setSelectedHazards: (value: string[]) => void; chooseDecision: (safe: boolean, feedback: string) => void
  activateStopWork: () => void; setEvidence: (value: string[]) => void; issueCertificate: () => void
  shareLearning: () => void; nextMission: () => void
  scanComplete: boolean; selectedPpe: PPEId[]; completeFieldScan: () => void; togglePpe: (id: PPEId) => void
  onSimulatorEvent: (event: SimulatorEvent) => void; completeSimulation: () => void
  role: RoleProfile
}

function MissionPlayer(props: PlayerProps) {
  const { mission, phase } = props
  const hazardsReady = mission.requiredHazards.every((id) => props.selectedHazards.includes(id))
  const evidenceReady = mission.evidence.every((item) => props.evidence.includes(item))
  const visiblePhases = Object.entries(phaseLabels).filter(([id]) => id !== 'simulation' || mission.simulation)
  const phaseIndex = visiblePhases.findIndex(([id]) => id === phase)

  const toggle = (value: string, list: string[], setList: (items: string[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  return (
    <section className="mission-player">
      <header className="mission-header">
        <button className="back-button" type="button" onClick={props.onBack}><ArrowLeft /> Volver al mapa</button>
        <div><span className="eyebrow">Mision {String(mission.order).padStart(2, '0')} · FATAL 5</span><h1>{mission.title}</h1><p>{mission.subtitle} · Ruta: {props.role.name}</p></div>
        <div className="mission-reward"><Award /><span><small>RECOMPENSA</small><strong>+{mission.reward} pts</strong></span></div>
      </header>

      <div className="phase-track" aria-label="Progreso de la mision">
        {visiblePhases.map(([id, label], index) => (
          <span key={id} className={index < phaseIndex ? 'done' : index === phaseIndex ? 'active' : ''}>
            <i>{index < phaseIndex ? <Check /> : index + 1}</i><b>{label}</b>
          </span>
        ))}
      </div>

      {phase === 'scan' ? (
        <ARScanner
          mission={mission}
          selectedPpe={props.selectedPpe}
          scanComplete={props.scanComplete}
          onTogglePpe={props.togglePpe}
          onScanComplete={props.completeFieldScan}
          onContinue={() => props.setPhase('hazards')}
        />
      ) : phase === 'simulation' && mission.simulation ? (
        <SimulatorExperience
          mission={mission}
          role={props.role}
          onEvent={props.onSimulatorEvent}
          onComplete={props.completeSimulation}
        />
      ) : <div className="mission-stage">
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
              <div className="role-context"><strong>Tu ruta por rol</strong><span>{props.role.name} · Esta mision aplica directamente a tu trabajo.</span></div>
              <div className="briefing-rule"><Shield /><span><strong>Regla de oro</strong>Si falta un control critico, la tarea no comienza.</span></div>
              <div className="device-modes" aria-label="Experiencia disponible por dispositivo">
                <span><Monitor /> PC</span><span><Smartphone /> Mobile</span><span><ScanLine /> AR Field Scan</span>
              </div>
              <button className="primary wide" onClick={() => props.setPhase('scan')}>Escanear escenario <ScanLine /></button>
            </div>
          )}

          {phase === 'hazards' && (
            <div className="panel-content">
              <span className="panel-kicker"><Eye /> EXPLORA</span>
              <h2>Confirma los tres riesgos que requieren control.</h2>
              <p>La asistencia visual sugiere. Tu criterio confirma antes de decidir.</p>
              <div className="option-list">
                {mission.hazards.map((hazard) => (
                  <button key={hazard.id} className={props.selectedHazards.includes(hazard.id) ? 'selected' : ''} onClick={() => toggle(hazard.id, props.selectedHazards, props.setSelectedHazards)}>
                    <span>{props.selectedHazards.includes(hazard.id) ? <Check /> : <Target />}</span>{hazard.label}
                  </button>
                ))}
              </div>
              <button className="primary wide" disabled={!hazardsReady} onClick={() => props.setPhase(mission.simulation ? 'simulation' : 'decision')}>
                {mission.simulation ? 'Abrir simulador especializado' : 'Confirmar riesgos'} <ArrowRight />
              </button>
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
                <div className="certificate-meta"><span>APM Buenos Aires</span><span>Prototipo educativo</span><span>FZ-{mission.order}2026</span></div>
              </div>
              <p className="certificate-note">Este reconocimiento no sustituye permisos, habilitaciones ni validacion HSSE local.</p>
              <button className="primary wide" onClick={() => props.setPhase('debrief')}>Ver impacto en las 9D <ArrowRight /></button>
            </div>
          )}

          {phase === 'debrief' && (
            <div className="panel-content">
              <span className="panel-kicker"><Shield /> CONTROLA EL PRESENTE</span>
              <h2>Tu accion fortalecio {mission.primaryDimensions.length} capacidades directas.</h2>
              <p>La ruta se adapta a tu rol. El ecosistema toma esa accion segura y la convierte en aprendizaje reutilizable.</p>
              <span className="debrief-label">IMPACTO DIRECTO DE TU ROL</span>
              <div className="debrief-grid">
                {mission.primaryDimensions.map((id) => <DimensionChip key={id} id={id} variant="primary" />)}
              </div>
              <span className="debrief-label">IMPACTO INFORMATIVO DEL ECOSISTEMA</span>
              <div className="debrief-grid supporting-dimensions">
                {mission.supportingDimensions.map((id) => <DimensionChip key={id} id={id} variant="supporting" />)}
              </div>
              <div className="collaboration-card"><Users /><span><small>{mission.collaboration.title}</small><strong>{mission.collaboration.description}</strong><em>{mission.collaboration.impact}</em></span></div>
              <div className="world-contribution"><Trophy /><span><small>APORTE WORLD CUP</small><strong>+{mission.reward} puntos · 1 zona convertida a verde · aprendizaje compartible</strong></span></div>
              <div className="cause-chain" aria-label="Cadena de impacto de la mision">
                <span><ScanLine /><b>Detectaste</b></span><i><ArrowRight /></i>
                <span><ShieldCheck /><b>Controlaste</b></span><i><ArrowRight /></i>
                <span><Award /><b>Certificaste</b></span><i><ArrowRight /></i>
                <span><Users /><b>Compartiste</b></span><i><ArrowRight /></i>
                <span><Trophy /><b>Escalaste</b></span>
              </div>
              <div className="decision-actions">
                <button className="secondary" onClick={props.shareLearning}><Users /> Compartir aprendizaje</button>
                <button className="primary" onClick={props.nextMission}>Siguiente mision <ArrowRight /></button>
              </div>
            </div>
          )}
        </div>
      </div>}
    </section>
  )
}

function DimensionChip({ id, variant }: { id: DimensionId; variant: 'primary' | 'supporting' }) {
  const dimension = dimensions[id]
  const variantClass = variant === 'primary' ? 'direct' : 'supporting'
  return <div className={`dimension-chip ${variantClass}`}><span>{dimension.number}</span><div><strong>{dimension.name}</strong><small>{dimension.value}</small></div></div>
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

function ChallengesView({
  progress, missionState, acceptChallenge, openMission,
}: {
  progress: GameProgress
  missionState: (mission: Mission) => MissionState
  acceptChallenge: (challenge: Challenge) => void
  openMission: (mission: Mission) => void
}) {
  const [rankingScope, setRankingScope] = useState<'personas' | 'equipos' | 'terminales'>('personas')
  const level = 7 + Math.floor(Math.max(0, progress.points - initialProgress.points) / 600)
  const nextLevel = initialProgress.points + (level - 6) * 600
  const levelProgress = Math.min(100, Math.round(((progress.points - (nextLevel - 600)) / 600) * 100))
  const rankings = {
    personas: [
      ['01', 'Lucia Torres', 'Supervisora · Trinca A', '3.180'],
      ['02', 'Mateo Silva', 'Operario · Trinca C', '2.940'],
      ['03', 'Carlos Medina', 'Tu perfil · Trinca B', progress.points.toLocaleString('es-AR')],
      ['04', 'Ana Rojas', 'Operaria · Muelle', '2.280'],
    ],
    equipos: [
      ['01', 'Trinca A', 'Turno noche', '18.420'],
      ['02', 'Trinca B', 'Tu cuadrilla', '17.860'],
      ['03', 'Acceso seguro', 'Turno manana', '16.990'],
      ['04', 'Muelle Sur', 'Equipo mixto', '15.730'],
    ],
    terminales: [
      ['01', 'Buenos Aires', 'Argentina', '48.250'],
      ['02', 'Callao', 'Peru', '44.780'],
      ['03', 'Moin', 'Costa Rica', '42.340'],
      ['04', 'Quetzal', 'Guatemala', '39.820'],
    ],
  }

  return (
    <section className="content-view challenges-view">
      <div className="challenge-hero">
        <img src={asset('lashing-5.png')} alt="Cuadrilla de trinca colaborando en una terminal" />
        <div className="challenge-hero-shade" />
        <div className="challenge-hero-copy">
          <span className="eyebrow">FATALZERO · MISION COOPERATIVA</span>
          <h1>Desafia a tu equipo.<br />Protejan una zona juntos.</h1>
          <p>Los desafios reconocen deteccion, competencia y ayuda. La rapidez no entrega ventajas en tareas criticas.</p>
          <div className="level-line"><span>NIVEL {level}</span><i><b style={{ width: `${levelProgress}%` }} /></i><strong>{progress.points.toLocaleString('es-AR')} XP</strong></div>
        </div>
        <div className="challenge-device-strip" aria-label="Experiencia conectada entre dispositivos">
          <span><Monitor /> Juega en PC</span><span><Smartphone /> Continua en mobile</span><span><ScanLine /> Verifica con AR</span>
        </div>
      </div>

      <div className="challenge-layout">
        <div className="challenge-board">
          <div className="section-heading">
            <div><span className="eyebrow">INVITACIONES Y MISIONES DE EQUIPO</span><h2>Una accion segura activa la siguiente.</h2></div>
            <span className="prototype-label">Illustrative prototype data</span>
          </div>
          <div className="challenge-cards">
            {challenges.map((challenge) => {
              const mission = missions.find((item) => item.id === challenge.missionId)!
              const state = missionState(mission)
              const accepted = progress.acceptedChallenges.includes(challenge.id)
              const completed = progress.completedChallenges.includes(challenge.id)
              return (
                <article className={`challenge-card ${completed ? 'completed' : accepted ? 'accepted' : ''}`} key={challenge.id}>
                  <div className="challenge-card-top"><span>{challenge.type === 'team' ? <Users /> : <Swords />}{challenge.subtitle}</span><b>+{challenge.reward} pts</b></div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.target}</p>
                  <div className="challenge-meta"><span><Users /> {challenge.participants} participantes</span><span><Award /> {challenge.badge}</span></div>
                  <div className="challenge-state-line"><i className={state} /><span>Mision {mission.order} · {mission.shortTitle}</span><b>{completed ? 'LOGRADO' : accepted ? 'ACTIVO' : state === 'locked' ? 'BLOQUEADO' : 'DISPONIBLE'}</b></div>
                  <button
                    className={completed ? 'secondary wide' : 'primary wide'}
                    type="button"
                    disabled={completed || state === 'locked'}
                    onClick={() => accepted ? openMission(mission) : acceptChallenge(challenge)}
                  >
                    {completed ? <><Check /> Reconocimiento obtenido</> : accepted ? <><Gamepad2 /> Continuar desafio</> : <><Swords /> Aceptar desafio</>}
                  </button>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="weekly-ranking">
          <div className="ranking-heading"><span className="eyebrow">RANKING SEMANAL</span><Crown /></div>
          <div className="ranking-switch" aria-label="Cambiar alcance del ranking">
            {(['personas', 'equipos', 'terminales'] as const).map((scope) => <button key={scope} className={rankingScope === scope ? 'active' : ''} onClick={() => setRankingScope(scope)}>{scope}</button>)}
          </div>
          <p>La posicion combina competencia, prevencion, colaboracion y controles sostenidos.</p>
          <div className="challenge-ranking-list">
            {rankings[rankingScope].map(([rank, name, detail, points]) => (
              <div className={name.includes('Carlos') || detail.includes('Tu ') ? 'player' : ''} key={name}>
                <strong>{rank}</strong><span><b>{name}</b><small>{detail}</small></span><em>{points}</em>
              </div>
            ))}
          </div>
          <div className="ranking-guardrail"><ShieldCheck /><span><strong>Ranking seguro</strong><small>Reportar mas nunca baja tu posicion. Ocultar un riesgo no genera puntos.</small></span></div>
        </aside>
      </div>

      <div className="safe-score-band">
        <div><span className="eyebrow">COMO SE CALCULA LA CONTRIBUCION</span><h2>La calidad de la accion vale mas que la velocidad.</h2></div>
        {[['Competencia', 30], ['Prevencion', 25], ['Colaboracion', 20], ['Control sostenido', 15], ['Conocimiento', 10]].map(([label, value]) => (
          <span key={String(label)}><b>{value}%</b><small>{label}</small></span>
        ))}
      </div>

      <div className="unlock-story" aria-label="Cadena de desbloqueo y recompensa">
        <span><ScanLine /><b>Escanea</b><small>Detecta una condicion</small></span><ArrowRight />
        <span><Hand /><b>Interviene</b><small>Controla o detiene</small></span><ArrowRight />
        <span><ShieldCheck /><b>Demuestra</b><small>Registra evidencia</small></span><ArrowRight />
        <span><Award /><b>Desbloquea</b><small>Certificado y zona</small></span><ArrowRight />
        <span><Users /><b>Multiplica</b><small>Ayuda a otra cuadrilla</small></span><ArrowRight />
        <span><Trophy /><b>Avanza</b><small>World Cup + 9D</small></span>
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
          ['01', 'APM Terminals Buenos Aires', 'Americas', '12.450'],
          ['02', 'Brasil Terminal Portuario', 'Americas', '11.980'],
          ['03', 'APM Terminals Moin', 'Americas', '11.620'],
          ['08', 'Tu cuadrilla · Buenos Aires', 'Trinca B', progress.points.toLocaleString('es-AR')],
        ].map(([rank, name, region, points]) => <div className={rank === '08' ? 'rank-row player' : 'rank-row'} key={name}><strong>{rank}</strong><span><b>{name}</b><small>{region}</small></span><em>{points} pts</em></div>)}</div>
      </div>
      <div className="five-years"><span className="eyebrow">El camino de cinco anos</span><h2>Del FATAL 5 al FATAL ZERO.</h2><div>{[['2027', 'FATAL 5', 'Fundar la memoria'], ['2028', 'FATAL 4', 'Entrenar capacidades'], ['2029', 'FATAL 3', 'Anticipar riesgos'], ['2030', 'FATAL 2', 'Medir y cooperar'], ['2031', 'FATAL ZERO', 'Sostener y liderar']].map(([year, fatal, goal], index) => <article key={year}><span>{year}</span><strong>{fatal}</strong><p>{goal}</p><i className={index === 0 ? 'active' : ''} /></article>)}</div></div>
    </section>
  )
}

export default App

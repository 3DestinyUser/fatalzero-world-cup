import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Challenge, GameProgress } from './types'
import './VI3WCommunicator.css'

export type VI3WPriority = 'normal' | 'high' | 'critical'
export type VI3WPetState = 'idle' | 'wave' | 'jump' | 'failed' | 'waiting' | 'review'

export interface VI3WContext {
  id: string
  section: string
  title: string
  summary: string
  challenge: string
  priority?: VI3WPriority
}

interface VI3WEvent {
  id: string
  section: string
  title: string
  message: string
  priority: VI3WPriority
  at: string
}

interface VI3WAchievement {
  id: string
  title: string
  message: string
  at: string
}

interface VI3WMemory {
  panelOpen: boolean
  activeTab: 'summary' | 'day' | 'challenges' | 'achievements'
  muted: boolean
  seenContexts: string[]
  events: VI3WEvent[]
  achievements: VI3WAchievement[]
}

interface ExternalPayload {
  id?: string
  kind?: 'notification' | 'context' | 'achievement' | 'command'
  command?: 'open' | 'close'
  title?: string
  message?: string
  summary?: string
  section?: string
  challenge?: string
  priority?: VI3WPriority
  speak?: boolean
}

export interface VI3WApi {
  version: string
  notify: (payload: ExternalPayload) => void
  setContext: (payload: ExternalPayload) => void
  celebrate: (payload: ExternalPayload) => void
  open: () => void
  close: () => void
  getSnapshot: () => object
}

interface Props {
  context: VI3WContext
  progress: GameProgress
  toast: string
  challenges: Challenge[]
}

const STORAGE_KEY = 'fatalzero-world-cup-vi3w-v1'
const MAX_EVENTS = 48
const PET_CONFIG_URL = `${import.meta.env.BASE_URL}assets/vi3w/pet.json`
const frame = { width: 192, height: 208 }
const petStates: Record<VI3WPetState, { row: number; frames: number; interval: number }> = {
  idle: { row: 0, frames: 6, interval: 240 },
  wave: { row: 3, frames: 4, interval: 170 },
  jump: { row: 4, frames: 5, interval: 130 },
  failed: { row: 5, frames: 8, interval: 135 },
  waiting: { row: 6, frames: 6, interval: 250 },
  review: { row: 8, frames: 6, interval: 165 },
}

const defaultMemory: VI3WMemory = {
  panelOpen: false,
  activeTab: 'summary',
  muted: false,
  seenContexts: [],
  events: [],
  achievements: [],
}

const eventId = () => globalThis.crypto?.randomUUID?.() ?? `vi3w-${Date.now()}-${Math.random().toString(16).slice(2)}`
const now = () => new Date().toISOString()

const loadMemory = (): VI3WMemory => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<VI3WMemory>
    return {
      ...defaultMemory,
      ...saved,
      seenContexts: Array.isArray(saved.seenContexts) ? saved.seenContexts : [],
      events: Array.isArray(saved.events) ? saved.events.slice(0, MAX_EVENTS) : [],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
    }
  } catch {
    return defaultMemory
  }
}

const isToday = (date: string) => {
  const item = new Date(date)
  const current = new Date()
  return item.getFullYear() === current.getFullYear()
    && item.getMonth() === current.getMonth()
    && item.getDate() === current.getDate()
}

const timeLabel = (date: string) => new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(date))

function PetCanvas({ state }: { state: VI3WPetState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let active = true
    let animationFrame = 0
    let currentFrame = 0
    let lastFrame = 0
    let lastState = stateRef.current
    const image = new Image()
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

    const draw = (row: number, column: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(
        image,
        column * frame.width,
        row * frame.height,
        frame.width,
        frame.height,
        0,
        0,
        frame.width,
        frame.height,
      )
    }

    const animate = (timestamp: number) => {
      if (!active) return
      const specification = petStates[stateRef.current]
      if (lastState !== stateRef.current) {
        lastState = stateRef.current
        currentFrame = 0
        lastFrame = 0
      }
      if (image.complete && image.naturalWidth) {
        if (reducedMotion.matches) {
          draw(specification.row, 0)
        } else if (!lastFrame || timestamp - lastFrame >= specification.interval) {
          draw(specification.row, currentFrame)
          currentFrame = (currentFrame + 1) % specification.frames
          lastFrame = timestamp
        }
      }
      animationFrame = requestAnimationFrame(animate)
    }

    fetch(PET_CONFIG_URL)
      .then((response) => {
        if (!response.ok) throw new Error('pet.json unavailable')
        return Promise.all([response.json() as Promise<{ spritesheetPath: string }>, response.url])
      })
      .then(([config, configUrl]) => {
        if (active) image.src = new URL(config.spritesheetPath, configUrl).href
      })
      .catch(() => {
        // The CSS fallback keeps VI3W+ visible when the atlas cannot load.
      })

    animationFrame = requestAnimationFrame(animate)
    return () => {
      active = false
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className="vi3w-canvas" width={frame.width} height={frame.height} />
}

export default function VI3WCommunicator({ context, progress, toast, challenges }: Props) {
  const [memory, setMemory] = useState<VI3WMemory>(loadMemory)
  const [externalContext, setExternalContext] = useState<VI3WContext | null>(null)
  const [petState, setPetState] = useState<VI3WPetState>('wave')
  const [bubble, setBubble] = useState<{ label: string; copy: string } | null>(null)
  const memoryRef = useRef(memory)
  const contextRef = useRef(context)
  const bubbleTimer = useRef(0)
  const petTimer = useRef(0)
  const previousProgress = useRef(progress)
  const previousToast = useRef('')
  const visibleContext = externalContext ?? context

  const updateMemory = useCallback((next: VI3WMemory) => {
    memoryRef.current = next
    setMemory(next)
  }, [])

  const playPet = useCallback((nextState: VI3WPetState, duration = 0) => {
    setPetState(nextState)
    window.clearTimeout(petTimer.current)
    if (duration > 0) {
      petTimer.current = window.setTimeout(() => setPetState('idle'), duration)
    }
  }, [])

  const showBubble = useCallback((label: string, copy: string, duration = 5000) => {
    setBubble({ label, copy })
    window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(null), duration)
  }, [])

  const addEvent = useCallback((payload: Omit<VI3WEvent, 'id' | 'at'> & { id?: string; at?: string }) => {
    const item: VI3WEvent = {
      ...payload,
      id: payload.id ?? eventId(),
      at: payload.at ?? now(),
    }
    const current = memoryRef.current
    const next = { ...current, events: [item, ...current.events].slice(0, MAX_EVENTS) }
    updateMemory(next)
    return item
  }, [updateMemory])

  const unlock = useCallback((id: string, title: string, message: string) => {
    const current = memoryRef.current
    if (current.achievements.some((achievement) => achievement.id === id)) return
    const achievement = { id, title, message, at: now() }
    updateMemory({ ...current, achievements: [achievement, ...current.achievements] })
    playPet('jump', 1900)
    showBubble('Nuevo logro', `${title}. ${message}`, 6200)
  }, [playPet, showBubble, updateMemory])

  const notify = useCallback((payload: ExternalPayload) => {
    const priority = payload.priority ?? 'normal'
    const item = addEvent({
      section: payload.section ?? contextRef.current.section,
      title: payload.title ?? 'Nueva señal',
      message: payload.message ?? payload.summary ?? '',
      priority,
    })
    playPet(priority === 'critical' ? 'failed' : 'review', 1900)
    showBubble(item.section, item.title, priority === 'critical' ? 6800 : 5200)
    if (payload.speak && !memoryRef.current.muted && 'speechSynthesis' in window) {
      const voice = new SpeechSynthesisUtterance(`${item.title}. ${item.message}`)
      voice.lang = 'es-AR'
      speechSynthesis.speak(voice)
    }
  }, [addEvent, playPet, showBubble])

  const celebrate = useCallback((payload: ExternalPayload) => {
    unlock(
      `external:${payload.id ?? eventId()}`,
      payload.title ?? 'Nuevo logro',
      payload.message ?? 'El sistema confirmó un nuevo hito.',
    )
  }, [unlock])

  useEffect(() => {
    memoryRef.current = memory
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  }, [memory])

  useEffect(() => {
    contextRef.current = context
    setExternalContext(null)
  }, [context])

  useEffect(() => {
    const current = memoryRef.current
    if (current.seenContexts.includes(visibleContext.id)) return
    updateMemory({ ...current, seenContexts: [...current.seenContexts, visibleContext.id] })
    addEvent({
      section: visibleContext.section,
      title: visibleContext.title,
      message: visibleContext.summary,
      priority: visibleContext.priority ?? 'normal',
    })
    playPet('review', 1600)
    if (!memoryRef.current.panelOpen) showBubble(visibleContext.section, visibleContext.title)
    unlock('first-signal', 'Primera señal', 'VI3W+ ya sigue tu recorrido en FATALZERO World Cup.')
  }, [addEvent, playPet, showBubble, unlock, updateMemory, visibleContext])

  useEffect(() => {
    if (!toast) {
      previousToast.current = ''
      return
    }
    if (toast === previousToast.current) return
    previousToast.current = toast
    const critical = toast.includes('SAFE FAILURE') || toast.includes('detenida')
    notify({
      section: context.section,
      title: critical ? 'Fallo seguro detectado' : 'Evento FATALZERO',
      message: toast,
      priority: critical ? 'critical' : 'high',
    })
  }, [context.section, notify, toast])

  useEffect(() => {
    const previous = previousProgress.current
    if (progress.reports > previous.reports) {
      unlock('first-report', 'Señal preventiva', 'Reportaste un riesgo y protegiste al equipo.')
    }
    if (progress.scans > previous.scans) {
      unlock('first-scan', 'Ojos en campo', 'Completaste un escaneo y detectaste señales antes de decidir.')
    }
    if (progress.certificates > previous.certificates) {
      unlock('first-certificate', 'Competencia demostrada', 'Una misión quedó certificada con evidencia.')
    }
    if (progress.collaborations > previous.collaborations) {
      unlock('first-collaboration', 'Aprendizaje compartido', 'Tu experiencia ya puede ayudar a otra cuadrilla.')
    }
    if (progress.completedChallenges.length > previous.completedChallenges.length) {
      unlock('first-team-challenge', 'Desafío cooperativo', 'El equipo convirtió una invitación en protección verificable.')
    }
    previousProgress.current = progress
  }, [progress, unlock])

  useEffect(() => {
    if (progress.reports > 0) unlock('first-report', 'Señal preventiva', 'Reportaste un riesgo y protegiste al equipo.')
    if (progress.scans > 0) unlock('first-scan', 'Ojos en campo', 'Completaste un escaneo y detectaste señales antes de decidir.')
    if (progress.certificates > 0) unlock('first-certificate', 'Competencia demostrada', 'Una misión quedó certificada con evidencia.')
    if (progress.collaborations > 0) unlock('first-collaboration', 'Aprendizaje compartido', 'Tu experiencia ya puede ayudar a otra cuadrilla.')
    if (progress.completedChallenges.length > 0) unlock('first-team-challenge', 'Desafío cooperativo', 'El equipo convirtió una invitación en protección verificable.')
  }, [progress, unlock])

  useEffect(() => {
    const handleVisibility = () => playPet(document.hidden ? 'waiting' : 'wave', document.hidden ? 0 : 1300)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [playPet])

  useEffect(() => {
    const api: VI3WApi = {
      version: '1.0.0',
      notify,
      setContext: (payload) => {
        setExternalContext({
          id: `external:${payload.id ?? eventId()}`,
          section: payload.section ?? 'Sistema conectado',
          title: payload.title ?? 'Contexto en tiempo real',
          summary: payload.summary ?? payload.message ?? 'VI3W+ recibió un nuevo contexto.',
          challenge: payload.challenge ?? 'Confirmá la señal y el próximo responsable.',
          priority: payload.priority ?? 'normal',
        })
      },
      celebrate,
      open: () => updateMemory({ ...memoryRef.current, panelOpen: true }),
      close: () => updateMemory({ ...memoryRef.current, panelOpen: false }),
      getSnapshot: () => ({
        context: externalContext ?? contextRef.current,
        progress,
        events: memoryRef.current.events,
        achievements: memoryRef.current.achievements,
      }),
    }
    const hostWindow = window as typeof window & { VI3W?: VI3WApi }
    hostWindow.VI3W = api

    const handleExternalEvent = (event: Event) => {
      const detail = (event as CustomEvent<ExternalPayload>).detail
      if (!detail) return
      if (detail.kind === 'context') api.setContext(detail)
      else if (detail.kind === 'achievement') api.celebrate(detail)
      else if (detail.kind === 'command') {
        if (detail.command === 'open') api.open()
        if (detail.command === 'close') api.close()
      } else api.notify(detail)
    }

    window.addEventListener('vi3w:event', handleExternalEvent)
    window.dispatchEvent(new CustomEvent('vi3w:ready', { detail: { name: 'VI3W+', version: api.version } }))
    return () => {
      delete hostWindow.VI3W
      window.removeEventListener('vi3w:event', handleExternalEvent)
    }
  }, [celebrate, externalContext, notify, progress, updateMemory])

  useEffect(() => () => {
    window.clearTimeout(bubbleTimer.current)
    window.clearTimeout(petTimer.current)
  }, [])

  const todayEvents = memory.events.filter((item) => isToday(item.at))
  const challengeStates = useMemo(() => challenges.map((challenge) => ({
    ...challenge,
    status: progress.completedChallenges.includes(challenge.id)
      ? 'logrado'
      : progress.acceptedChallenges.includes(challenge.id)
        ? 'activo'
        : 'disponible',
  })), [challenges, progress.acceptedChallenges, progress.completedChallenges])

  const setPanelOpen = (panelOpen: boolean) => {
    updateMemory({ ...memoryRef.current, panelOpen })
    if (panelOpen) {
      setBubble(null)
      playPet('wave', 1300)
    }
  }

  const setActiveTab = (activeTab: VI3WMemory['activeTab']) => {
    updateMemory({ ...memoryRef.current, activeTab })
  }

  const toggleMute = () => {
    const muted = !memoryRef.current.muted
    if (muted && 'speechSynthesis' in window) speechSynthesis.cancel()
    updateMemory({ ...memoryRef.current, muted })
  }

  const speakContext = () => {
    if (memory.muted || !('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const voice = new SpeechSynthesisUtterance(
      `${visibleContext.section}. ${visibleContext.title}. ${visibleContext.summary}. Desafío: ${visibleContext.challenge}`,
    )
    voice.lang = 'es-AR'
    voice.rate = 1.02
    speechSynthesis.speak(voice)
  }

  return (
    <>
      <section className="vi3w-shell" data-open={memory.panelOpen} data-api="ready" aria-label="VI3W+ microcomunicador">
        <aside className="vi3w-panel" id="vi3w-panel" aria-label="Centro de comunicación VI3W+">
          <header className="vi3w-panel-header">
            <div><p><i /> EN VIVO · WORLD CUP</p><h2>VI3W+ <small>by 3Destiny</small></h2></div>
            <div className="vi3w-header-actions">
              <button type="button" onClick={toggleMute} aria-label={memory.muted ? 'Activar voz' : 'Silenciar voz'}>
                {memory.muted ? '○' : '◖'}
              </button>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Cerrar comunicador">×</button>
            </div>
          </header>

          <section className="vi3w-context" aria-live="polite">
            <div className="vi3w-context-label"><span>Estás mirando</span><b data-priority={visibleContext.priority ?? 'normal'}>
              {visibleContext.priority === 'critical' ? 'crítico' : visibleContext.priority === 'high' ? 'prioridad' : 'seguimiento'}
            </b></div>
            <h3>{visibleContext.title}</h3>
            <p>{visibleContext.summary}</p>
            <div className="vi3w-next"><span>→</span><div><strong>Desafío por delante</strong><small>{visibleContext.challenge}</small></div></div>
          </section>

          <nav className="vi3w-tabs" aria-label="Secciones de VI3W+">
            {([
              ['summary', 'Resumen'],
              ['day', 'Tu día'],
              ['challenges', 'Desafíos'],
              ['achievements', 'Logros'],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} aria-selected={memory.activeTab === id}>{label}</button>
            ))}
          </nav>

          <div className="vi3w-body">
            {memory.activeTab === 'summary' && (
              <section className="vi3w-view">
                <h4>Pulso de tu recorrido</h4>
                <div className="vi3w-stats">
                  <span><strong>{progress.completed.length}/8</strong><small>Misiones</small></span>
                  <span><strong>{progress.points.toLocaleString('es-AR')}</strong><small>Puntos</small></span>
                  <span><strong>{memory.achievements.length}</strong><small>Logros</small></span>
                </div>
                <button className="vi3w-action" type="button" disabled={memory.muted} onClick={speakContext}>Escuchar resumen de esta sección</button>
              </section>
            )}

            {memory.activeTab === 'day' && (
              <section className="vi3w-view">
                <h4>Señales de hoy · {todayEvents.length}</h4>
                {todayEvents.length ? <ol className="vi3w-list">{todayEvents.map((item) => (
                  <li className="vi3w-event" data-priority={item.priority} key={item.id}>
                    <span><small>{item.section}</small><time>{timeLabel(item.at)}</time></span>
                    <strong>{item.title}</strong><p>{item.message}</p>
                  </li>
                ))}</ol> : <p className="vi3w-empty">Todavía no hay señales registradas hoy.</p>}
              </section>
            )}

            {memory.activeTab === 'challenges' && (
              <section className="vi3w-view">
                <h4>Desafíos semanales</h4>
                <ol className="vi3w-list">{challengeStates.map((item) => (
                  <li className={`vi3w-challenge is-${item.status}`} key={item.id}>
                    <span><small>{item.subtitle}</small><b>{item.status}</b></span>
                    <strong>{item.title}</strong><p>{item.target}</p>
                    <em>+{item.reward} pts · {item.participants} participantes</em>
                  </li>
                ))}</ol>
              </section>
            )}

            {memory.activeTab === 'achievements' && (
              <section className="vi3w-view">
                <h4>Logros desbloqueados · {memory.achievements.length}</h4>
                {memory.achievements.length ? <ol className="vi3w-list">{memory.achievements.map((item) => (
                  <li className="vi3w-achievement" key={item.id}>
                    <span><small>Logro</small><time>{timeLabel(item.at)}</time></span>
                    <strong>{item.title}</strong><p>{item.message}</p>
                  </li>
                ))}</ol> : <p className="vi3w-empty">Tu primer logro aparecerá cuando VI3W+ reconozca una acción segura.</p>}
              </section>
            )}
          </div>
        </aside>

        {bubble && !memory.panelOpen && (
          <div className="vi3w-speech" role="status"><strong>{bubble.label}</strong><span>{bubble.copy}</span></div>
        )}

        <button
          className="vi3w-launcher"
          type="button"
          onClick={() => setPanelOpen(!memory.panelOpen)}
          aria-controls="vi3w-panel"
          aria-expanded={memory.panelOpen}
        >
          <span className="vi3w-stage" aria-hidden="true"><PetCanvas state={petState} /></span>
          <span className="vi3w-launcher-copy"><strong>VI3W+</strong><small>MICROcomunicador 3D</small></span>
          <span className="vi3w-live-dot" aria-label="Conectado" />
        </button>
      </section>
    </>
  )
}

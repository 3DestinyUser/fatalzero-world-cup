import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowRight, Check, CircleGauge, Gamepad2, RotateCcw,
  ShieldCheck, StopCircle,
} from 'lucide-react'
import {
  createSimulatorContext,
  createSimulatorEvent,
  parseSimulatorEvent,
  UNITY_MESSAGE_SOURCE,
} from './simulatorBridge'
import type {
  Mission,
  RoleProfile,
  SimulatorEngine,
  SimulatorEvent,
} from './types'

interface UnityCatalogBuild {
  enabled: boolean
  launchUrl: string
  label: string
}

interface UnityCatalog {
  protocolVersion: 1
  builds: Record<string, UnityCatalogBuild>
}

interface SimulatorExperienceProps {
  mission: Mission
  role: RoleProfile
  onEvent: (event: SimulatorEvent) => void
  onComplete: () => void
}

const catalogUrl = `${import.meta.env.BASE_URL}unity/catalog.json`

export default function SimulatorExperience({
  mission,
  role,
  onEvent,
  onComplete,
}: SimulatorExperienceProps) {
  const config = mission.simulation
  const [stepIndex, setStepIndex] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [safeFailure, setSafeFailure] = useState(false)
  const [unityBuild, setUnityBuild] = useState<UnityCatalogBuild | null>(null)
  const [catalogChecked, setCatalogChecked] = useState(false)
  const [engine, setEngine] = useState<SimulatorEngine>('web-safety')
  const frameRef = useRef<HTMLIFrameElement>(null)
  const startedRef = useRef(false)
  const sessionId = useMemo(
    () => `${mission.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    [mission.id],
  )
  const context = useMemo(
    () => createSimulatorContext(mission, role, sessionId),
    [mission, role, sessionId],
  )

  useEffect(() => {
    let active = true
    fetch(catalogUrl)
      .then((response) => response.ok ? response.json() as Promise<UnityCatalog> : null)
      .then((catalog) => {
        if (!active || !config?.unityBuildKey || !catalog) return
        const build = catalog.builds[config.unityBuildKey]
        if (build?.enabled) {
          setUnityBuild(build)
          setEngine('unity-webgl')
        }
      })
      .catch(() => undefined)
      .finally(() => { if (active) setCatalogChecked(true) })
    return () => { active = false }
  }, [config?.unityBuildKey])

  useEffect(() => {
    if (!config || !catalogChecked || startedRef.current) return
    startedRef.current = true
    onEvent(createSimulatorEvent(context, engine, 'session.started', {
      simulatorId: config.id,
      scenario: config.scenario,
    }))
  }, [catalogChecked, config, context, engine, onEvent])

  useEffect(() => {
    const receive = (value: SimulatorEvent | string) => {
      const event = parseSimulatorEvent(value, context)
      if (!event) return
      onEvent(event)
      if (event.type === 'simulation.completed') onComplete()
    }

    const postContext = () => {
      if (!unityBuild || !frameRef.current?.contentWindow) return
      const launchUrl = new URL(unityBuild.launchUrl, window.location.href)
      frameRef.current.contentWindow.postMessage({
        source: 'fatalzero-platform',
        type: 'mission.context',
        context,
      }, launchUrl.origin)
    }

    const handleMessage = (message: MessageEvent) => {
      if (message.source !== frameRef.current?.contentWindow) return
      if (message.data?.source !== UNITY_MESSAGE_SOURCE) return
      if (message.data.type === 'runtime.ready') {
        postContext()
        return
      }
      receive(message.data.event)
    }

    window.FatalZeroSimulatorBridge = {
      protocolVersion: 1,
      getMissionContext: () => context,
      receiveEvent: receive,
    }
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
      delete window.FatalZeroSimulatorBridge
    }
  }, [context, onComplete, onEvent, unityBuild])

  useEffect(() => {
    if (!unityBuild || !frameRef.current?.contentWindow) return
    const launchUrl = new URL(unityBuild.launchUrl, window.location.href)
    const postContext = () => frameRef.current?.contentWindow?.postMessage({
      source: 'fatalzero-platform',
      type: 'mission.context',
      context,
    }, launchUrl.origin)
    const frame = frameRef.current
    frame.addEventListener('load', postContext)
    return () => frame.removeEventListener('load', postContext)
  }, [context, unityBuild])

  if (!config) return null

  const currentStep = config.steps[stepIndex]
  const completed = stepIndex >= config.steps.length
  const progress = Math.round((stepIndex / config.steps.length) * 100)

  const chooseSafe = () => {
    if (!currentStep) return
    setFeedback(currentStep.successFeedback)
    setSafeFailure(false)
    onEvent(createSimulatorEvent(context, engine, 'control.confirmed', {
      stepId: currentStep.id,
      control: currentStep.safeAction,
    }))
    window.setTimeout(() => setStepIndex((current) => current + 1), 320)
  }

  const chooseUnsafe = () => {
    if (!currentStep) return
    setFeedback(currentStep.failureFeedback)
    setSafeFailure(true)
    onEvent(createSimulatorEvent(context, engine, 'safe_failure', {
      stepId: currentStep.id,
      attemptedAction: currentStep.unsafeAction,
      speedReward: false,
    }))
  }

  const completeSimulation = () => {
    onEvent(createSimulatorEvent(context, engine, 'simulation.completed', {
      controlsConfirmed: config.steps.length,
      speedReward: false,
      humanValidationRequired: true,
    }))
    onComplete()
  }

  if (unityBuild) {
    return (
      <section className="specialized-simulator unity-runtime" data-testid="unity-simulator">
        <header className="simulator-runtime-bar">
          <span><Gamepad2 /> SIMULADOR ESPECIALIZADO</span>
          <b><i className="runtime-light" /> {unityBuild.label}</b>
        </header>
        <iframe
          ref={frameRef}
          src={new URL(unityBuild.launchUrl, window.location.href).href}
          title={`Simulador Unity: ${mission.title}`}
          allow="fullscreen; gamepad; microphone"
        />
      </section>
    )
  }

  return (
    <section className="specialized-simulator" data-testid="web-safety-simulator">
      <div className="simulator-visual">
        <img src={mission.image} alt={`Escenario interactivo de ${mission.title}`} />
        <div className="simulator-visual-shade" />
        <header className="simulator-runtime-bar">
          <span><Gamepad2 /> SIMULADOR ESPECIALIZADO</span>
          <b><i className="runtime-light" /> {catalogChecked ? 'Modo guiado activo' : 'Preparando escenario'}</b>
        </header>
        <div className="simulator-reticle">
          <i /><i /><i /><i />
          <CircleGauge />
          <span>{progress}%</span>
        </div>
        <div className="simulator-scenario">
          <small>ESCENARIO</small>
          <strong>{config.scenario}</strong>
        </div>
      </div>

      <aside className="simulator-console">
        <span className="panel-kicker"><ShieldCheck /> PRACTICA CONTROLADA</span>
        <h2>{config.title}</h2>
        <p>El motor evalua decisiones y controles. La velocidad no genera puntos.</p>

        <div className="simulator-progress">
          <span><b>{Math.min(stepIndex + 1, config.steps.length)}</b> / {config.steps.length}</span>
          <i><b style={{ width: `${progress}%` }} /></i>
        </div>

        {!completed && currentStep && (
          <div className="simulator-step">
            <small>CONTROL {String(stepIndex + 1).padStart(2, '0')}</small>
            <h3>{currentStep.prompt}</h3>
            <button className="simulator-choice safe" type="button" onClick={chooseSafe}>
              <ShieldCheck /> <span><b>{currentStep.safeAction}</b><small>Aplicar control critico</small></span>
            </button>
            <button className="simulator-choice unsafe" type="button" onClick={chooseUnsafe}>
              <AlertTriangle /> <span><b>{currentStep.unsafeAction}</b><small>Probar decision insegura</small></span>
            </button>
          </div>
        )}

        {feedback && (
          <div className={safeFailure ? 'simulator-feedback failure' : 'simulator-feedback success'}>
            {safeFailure ? <StopCircle /> : <Check />}
            <span><strong>{safeFailure ? 'Fallo seguro' : 'Control confirmado'}</strong>{feedback}</span>
          </div>
        )}

        {completed && (
          <div className="simulator-complete">
            <ShieldCheck />
            <span><small>SIMULACION COMPLETADA</small><strong>Controles confirmados sin recompensa por velocidad.</strong></span>
            <button className="primary wide" type="button" onClick={completeSimulation}>Transferir resultado a FATALZERO <ArrowRight /></button>
          </div>
        )}

        {safeFailure && (
          <button className="simulator-retry" type="button" onClick={() => { setSafeFailure(false); setFeedback('') }}>
            <RotateCcw /> Reintentar desde el control actual
          </button>
        )}

      </aside>
    </section>
  )
}

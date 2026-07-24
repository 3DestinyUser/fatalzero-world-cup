import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, BrainCircuit, Camera, Check, Eye, ScanLine, ShieldCheck,
  Smartphone, Sparkles,
} from 'lucide-react'
import { ppeCatalog } from './gameData'
import type { Mission, PPEId } from './types'

type ScannerStatus = 'idle' | 'camera' | 'fallback' | 'analyzing' | 'complete'

interface ARScannerProps {
  mission: Mission
  selectedPpe: PPEId[]
  scanComplete: boolean
  onTogglePpe: (id: PPEId) => void
  onScanComplete: () => void
  onContinue: () => void
}

export default function ARScanner({
  mission, selectedPpe, scanComplete, onTogglePpe, onScanComplete, onContinue,
}: ARScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>(scanComplete ? 'complete' : 'idle')
  const [cameraMessage, setCameraMessage] = useState('La camara solo se usa en este dispositivo. No se graba ni se envia contenido.')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => () => {
    stopCamera()
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('fallback')
      setCameraMessage('La camara no esta disponible en este contexto. Puedes usar el escenario de demostracion.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('camera')
      setCameraMessage('Camara activa. Orienta el dispositivo hacia la zona de trabajo y ejecuta el analisis.')
    } catch {
      setStatus('fallback')
      setCameraMessage('No se concedio acceso a la camara. El escenario visual permite probar el mismo flujo.')
    }
  }

  const analyze = () => {
    setStatus('analyzing')
    timerRef.current = window.setTimeout(() => {
      setStatus('complete')
      onScanComplete()
      stopCamera()
    }, 900)
  }

  const kitReady = mission.requiredPpe.every((id) => selectedPpe.includes(id))
  const visiblePpe = ppeCatalog.filter((item) => mission.requiredPpe.includes(item.id) || ['vest', 'hearing', 'loto'].includes(item.id)).slice(0, 6)
  const sourceLabels = {
    'apm-approved': 'APM APPROVED',
    'visual-control': 'VISUAL CONTROL',
    'local-validation': 'VALIDACION LOCAL',
  } as const

  return (
    <div className="ar-experience" data-testid="ar-scanner">
      <div className="ar-feed">
        <video ref={videoRef} className={status === 'camera' || status === 'analyzing' ? 'is-visible' : ''} muted playsInline aria-label="Vista de camara para escaneo de campo" />
        <img className={status === 'camera' || status === 'analyzing' ? '' : 'is-visible'} src={mission.fieldScanImage ?? mission.image} alt={`Escenario de campo para ${mission.title}`} />
        <div className="ar-feed-shade" />
        <div className="ar-topline">
          <span><Smartphone /> FIELD SCAN</span>
          <b><BrainCircuit /> AI ASSISTED · PROTOTIPO</b>
        </div>
        <div className={`scan-reticle ${status === 'analyzing' ? 'is-analyzing' : ''}`} aria-hidden="true"><i /><i /><i /><i /><ScanLine /></div>
        {status === 'analyzing' && <div className="ar-analyzing"><Sparkles /> Analizando patrones visibles...</div>}
        {status === 'complete' && (
          <div className="ar-markers" aria-label="Hallazgos sugeridos por el prototipo">
            {mission.requiredHazards.map((id, index) => {
              const hazard = mission.hazards.find((item) => item.id === id)
              return <span key={id} style={{ left: `${24 + index * 25}%`, top: `${30 + (index % 2) * 25}%` }}><i>{index + 1}</i>{hazard?.label}</span>
            })}
          </div>
        )}
        <div className="ar-feed-actions">
          {status === 'idle' && <button type="button" className="secondary" onClick={startCamera}><Camera /> Activar camara</button>}
          {(status === 'idle' || status === 'fallback') && <button type="button" className="secondary" data-testid="use-demo-scene" onClick={() => setStatus('fallback')}><Eye /> Usar escenario demo</button>}
          {(status === 'camera' || status === 'fallback') && <button type="button" className="primary" data-testid="run-ai-scan" onClick={analyze}><ScanLine /> Escanear zona</button>}
          {status === 'complete' && <span className="scan-confirmed"><ShieldCheck /> {mission.requiredHazards.length} hallazgos para confirmar</span>}
        </div>
      </div>

      <aside className="ar-console">
        <div className="ar-console-heading">
          <span className="panel-kicker"><BrainCircuit /> ASISTENCIA DE CAMPO</span>
          <h2>Observa, confirma y prepara el control.</h2>
          <p>{cameraMessage}</p>
        </div>

        <section className="ai-findings">
          <header><strong>Hallazgos sugeridos</strong><small>Requieren confirmacion humana</small></header>
          {mission.requiredHazards.map((id, index) => {
            const hazard = mission.hazards.find((item) => item.id === id)
            return (
              <div key={id} className={status === 'complete' ? 'found' : ''}>
                <span>{status === 'complete' ? <AlertTriangle /> : <ScanLine />}</span>
                <b>{status === 'complete' ? hazard?.label : 'Pendiente de escaneo'}</b>
                <em>{status === 'complete' ? `${94 - index * 3}%` : '--'}</em>
              </div>
            )
          })}
        </section>

        <section className="field-kit">
          <header><strong>Prepara tu equipo</strong><small>{selectedPpe.filter((id) => mission.requiredPpe.includes(id)).length}/{mission.requiredPpe.length} requeridos</small></header>
          <div>
            {visiblePpe.map((item) => {
              const selected = selectedPpe.includes(item.id)
              const required = mission.requiredPpe.includes(item.id)
              return (
                <button key={item.id} type="button" className={selected ? 'selected' : ''} onClick={() => onTogglePpe(item.id)} aria-pressed={selected}>
                  <span>{selected ? <Check /> : <ShieldCheck />}</span><b>{item.name}</b><small>{required ? item.power : 'No requerido en esta mision'}</small>
                </button>
              )
            })}
          </div>
        </section>

        <section className="critical-controls">
          <strong>Controles antes del EPP</strong>
          {mission.criticalControls.map((control) => <span key={control}><Check /> {control}</span>)}
        </section>

        {!!mission.sources?.length && (
          <section className="content-provenance">
            <header>
              <strong>Base de control</strong>
              <small>Contenido trazable · alcance prototipo</small>
            </header>
            <div>
              {mission.sources.map((source) => (
                <details key={source.id}>
                  <summary>
                    <span className={`source-status ${source.status}`}>{sourceLabels[source.status]}</span>
                    <b>{source.title}</b>
                    <small>{source.version}{source.locator ? ` · ${source.locator}` : ''}</small>
                  </summary>
                  <p>{source.application}</p>
                  <code>{source.document}</code>
                </details>
              ))}
            </div>
          </section>
        )}

        <button className="primary wide" data-testid="confirm-field-scan" type="button" disabled={status !== 'complete' || !kitReady} onClick={onContinue}>
          Confirmar en el escenario <ShieldCheck />
        </button>
        <small className="ai-disclaimer">La asistencia visual no autoriza la tarea. El operario confirma; el supervisor valida.</small>
      </aside>
    </div>
  )
}

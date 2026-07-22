import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, Html, OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { Maximize2, MousePointer2, Pause, Play, RotateCcw } from 'lucide-react'
import type { Mission, MissionState } from './types'

const modelUrl = `${import.meta.env.BASE_URL}assets/3d/apm-terminal-buenos-aires.glb`

const markerPositions: Record<number, [number, number]> = {
  1: [561, 394], 2: [202, 168], 3: [-139, -76], 4: [-366, 206],
  5: [-120, -300], 6: [100, -250], 7: [-537, -151], 8: [350, -20],
}

interface TerminalMap3DProps {
  missions: Mission[]
  missionState: (mission: Mission) => MissionState
  openMission: (mission: Mission) => void
}

function LoadingStatus() {
  const { progress } = useProgress()
  return (
    <div className="map-3d-loading" role="status">
      <span>{Math.round(progress)}%</span>
      <div><i style={{ width: `${progress}%` }} /></div>
      <small>Cargando terminal Buenos Aires</small>
    </div>
  )
}

function TerminalModel({ missions, missionState, openMission }: TerminalMap3DProps) {
  const { scene } = useGLTF(modelUrl)
  const model = useMemo(() => scene.clone(), [scene])

  return (
    <Center top>
      <primitive object={model} />
      {missions.map((mission) => {
        const state = missionState(mission)
        const [x, z] = markerPositions[mission.order] ?? [0, 0]
        const color = state === 'locked' ? '#e63139' : state === 'completed' || state === 'sustained' ? '#55bf58' : '#f2ad3d'
        return (
          <group key={mission.id} position={[x, 105, z]}>
            <mesh onClick={(event) => { event.stopPropagation(); openMission(mission) }}>
              <sphereGeometry args={[22, 24, 24]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <Html center distanceFactor={950} zIndexRange={[20, 0]}>
              <button
                className={`map-3d-pin ${state}`}
                type="button"
                onClick={() => openMission(mission)}
                aria-label={`${mission.title}. Estado: ${state}`}
                title={mission.title}
              >
                {mission.order}
              </button>
            </Html>
          </group>
        )
      })}
    </Center>
  )
}

export default function TerminalMap3D(props: TerminalMap3DProps) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraKey, setCameraKey] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await stageRef.current?.requestFullscreen()
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.fullscreenElement) {
        void document.exitFullscreen()
        return
      }
      if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey) void toggleFullscreen()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div ref={stageRef} className="map-3d-stage" onPointerEnter={() => setAutoRotate(false)}>
      <Suspense fallback={<LoadingStatus />}>
        <Canvas
          key={cameraKey}
          camera={{ position: [1200, 1050, 1200], fov: 36, near: 1, far: 10000 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          onCreated={({ gl }) => gl.setClearColor('#07141e')}
        >
          <ambientLight intensity={1.4} />
          <Bounds fit clip observe margin={1.12}>
            <TerminalModel {...props} />
          </Bounds>
          <OrbitControls
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={0.42}
            enableDamping
            dampingFactor={0.07}
            minPolarAngle={0.3}
            maxPolarAngle={1.45}
            minDistance={450}
            maxDistance={4200}
          />
        </Canvas>
      </Suspense>
      <div className="map-3d-toolbar" aria-label="Controles del mapa 3D">
        <button type="button" onClick={() => setAutoRotate((value) => !value)} title={autoRotate ? 'Pausar rotacion' : 'Activar rotacion'}>
          {autoRotate ? <Pause /> : <Play />}
        </button>
        <button type="button" onClick={() => setCameraKey((value) => value + 1)} title="Restablecer camara"><RotateCcw /></button>
        <button type="button" onClick={() => void toggleFullscreen()} title="Pantalla completa (F)"><Maximize2 /></button>
      </div>
      <div className="map-3d-help"><MousePointer2 /> Arrastra para rotar · rueda para acercar · F pantalla completa</div>
    </div>
  )
}

useGLTF.preload(modelUrl)

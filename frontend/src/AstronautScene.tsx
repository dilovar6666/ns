import { Suspense, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useAnimations, useGLTF, Html } from '@react-three/drei'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import type { Group } from 'three'

export type SensorZone = 'chest' | 'helmet' | 'wrist' | 'plss' | 'lcvg' | 'full'
export type ViewMode = 'standard' | 'xray' | 'thermal'

export type AstronautSceneProps = {
  viewMode?: ViewMode
  activeZone?: SensorZone
  onSelectZone?: (zone: SensorZone) => void
  interactive?: boolean
}

const HOTSPOT_CONFIGS = [
  { id: 'chest' as const, pos: [0, 0.10, 0.28] as const, label: 'ЭКГ (Грудь)', color: '#ff2d55' },
  { id: 'helmet' as const, pos: [0, 0.46, 0.25] as const, label: 'Шлем / Визор', color: '#22d3ee' },
  { id: 'plss' as const, pos: [0, 0.20, -0.38] as const, label: 'Рюкзак PLSS', color: '#a855f7' },
  { id: 'wrist' as const, pos: [-0.60, -0.05, 0.16] as const, label: 'SpO₂ Запястье', color: '#32ade6' },
  { id: 'lcvg' as const, pos: [0, -0.35, 0.24] as const, label: 'Контур LCVG', color: '#f59e0b' },
]

function HotspotMarker({
  id,
  pos,
  label,
  color,
  isActive,
  onClick,
}: {
  id: SensorZone
  pos: readonly [number, number, number]
  label: string
  color: string
  isActive: boolean
  onClick: () => void
}) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3.5) * 0.18
      ringRef.current.scale.set(s, s, s)
    }
  })

  return (
    <group position={pos as [number, number, number]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef} rotation={id === 'plss' ? [0, Math.PI, 0] : [0, 0, 0]}>
        <ringGeometry args={[0.035, 0.052, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isActive ? 0.95 : 0.65}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Center glowing dot */}
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* HTML tooltip label */}
      <Html
        distanceFactor={3.2}
        center
        position={[0, 0.065, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none', cursor: 'pointer' }}
      >
        <div
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{
            background: isActive ? color : 'rgba(10, 18, 32, 0.88)',
            color: isActive ? '#fff' : color,
            border: `1px solid ${color}`,
            borderRadius: '6px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: isActive ? `0 0 12px ${color}` : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}

function XRayScanBeam() {
  const beamRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (beamRef.current) {
      beamRef.current.position.y = -0.2 + Math.sin(state.clock.elapsedTime * 2.2) * 0.9
    }
  })

  return (
    <mesh ref={beamRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshBasicMaterial
        color="#00f3ff"
        transparent
        opacity={0.18}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function Model({
  viewMode = 'standard',
  activeZone,
  onSelectZone,
  interactive = false,
}: {
  viewMode?: ViewMode
  activeZone?: SensorZone
  onSelectZone?: (zone: SensorZone) => void
  interactive?: boolean
}) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF('/models/astronaut.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    const action = actions.floating || actions.idle
    action?.play()
    return () => {
      action?.stop()
    }
  }, [actions])

  // Thermal Shader Material with Infrared color ramp
  const thermalMaterial = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const grad = ctx.createLinearGradient(0, 0, 256, 0)
    grad.addColorStop(0.0, '#1e1b4b') // Deep cold purple/blue (16°C)
    grad.addColorStop(0.18, '#2563eb') // Blue (20°C)
    grad.addColorStop(0.38, '#06b6d4') // Cyan (24°C)
    grad.addColorStop(0.58, '#10b981') // Green (28°C)
    grad.addColorStop(0.74, '#eab308') // Yellow (32°C)
    grad.addColorStop(0.88, '#f97316') // Warm Orange (35°C)
    grad.addColorStop(1.0, '#dc2626') // Hot Red (38°C)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 256, 1)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    return new THREE.ShaderMaterial({
      uniforms: {
        thermalMap: { value: texture },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform sampler2D thermalMap;
        varying vec3 vWorldPos;
        void main() {
          float t = clamp((vWorldPos.y - (-1.15)) / 1.95, 0.0, 1.0);
          float distChest = length(vWorldPos - vec3(0.0, 0.1, 0.15));
          if (distChest < 0.35) {
            t = mix(t, 0.96, (0.35 - distChest) / 0.35 * 0.55);
          }
          vec4 col = texture2D(thermalMap, vec2(t, 0.5));
          gl_FragColor = vec4(col.rgb, 1.0);
        }
      `,
      lights: false,
    })
  }, [])

  // X-Ray Holographic Material
  const xrayMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#00e5ff'),
      emissive: new THREE.Color('#004466'),
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.38,
      wireframe: false,
      roughness: 0.2,
      metalness: 0.8,
      depthWrite: false,
    })
  }, [])

  const originalMaterials = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map())

  useEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (!originalMaterials.current.has(mesh)) {
          originalMaterials.current.set(mesh, mesh.material)
        }
      }
    });
  }, [clone])

  useEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const orig = originalMaterials.current.get(mesh)
        if (viewMode === 'standard') {
          if (orig) mesh.material = orig
        } else if (viewMode === 'xray') {
          mesh.material = xrayMaterial
        } else if (viewMode === 'thermal' && thermalMaterial) {
          mesh.material = thermalMaterial
        }
      }
    })
  }, [clone, viewMode, xrayMaterial, thermalMaterial])

  return (
    <group ref={group} position={[0, -1.22, 0]} scale={0.80}>
      <primitive object={clone} />

      {/* X-Ray Sweep Scan Beam */}
      {viewMode === 'xray' && <XRayScanBeam />}

      {/* Interactive 3D Hotspot Pins */}
      {interactive && onSelectZone && HOTSPOT_CONFIGS.map((cfg) => (
        <HotspotMarker
          key={cfg.id}
          id={cfg.id}
          pos={cfg.pos}
          label={cfg.label}
          color={cfg.color}
          isActive={activeZone === cfg.id}
          onClick={() => onSelectZone(cfg.id)}
        />
      ))}
    </group>
  )
}

function CameraManager({
  activeZone,
  isMobile,
  controlsRef,
}: {
  activeZone?: SensorZone
  isMobile: boolean
  controlsRef: React.RefObject<any>
}) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, isMobile ? -0.22 : -0.20, isMobile ? 3.5 : 3.1))
  const targetLook = useRef(new THREE.Vector3(0, isMobile ? -0.28 : -0.25, 0))

  useEffect(() => {
    if (!activeZone || activeZone === 'full') {
      targetPos.current.set(0, isMobile ? -0.22 : -0.20, isMobile ? 3.5 : 3.1)
      targetLook.current.set(0, isMobile ? -0.28 : -0.25, 0)
      return
    }

    switch (activeZone) {
      case 'chest':
        targetPos.current.set(0, 0.20, isMobile ? 1.55 : 1.35)
        targetLook.current.set(0, 0.16, 0)
        break
      case 'helmet':
        targetPos.current.set(0, 0.46, isMobile ? 1.25 : 1.10)
        targetLook.current.set(0, 0.44, 0)
        break
      case 'plss':
        targetPos.current.set(0, 0.28, isMobile ? -1.75 : -1.55)
        targetLook.current.set(0, 0.20, -0.20)
        break
      case 'wrist':
        targetPos.current.set(-0.85, 0.10, isMobile ? 1.10 : 0.90)
        targetLook.current.set(-0.60, 0.05, 0.10)
        break
      case 'lcvg':
        targetPos.current.set(0, -0.30, isMobile ? 2.80 : 2.45)
        targetLook.current.set(0, -0.35, 0)
        break
    }
  }, [activeZone, isMobile])

  useFrame((_, delta) => {
    const step = Math.min(1, delta * 3.8)
    camera.position.lerp(targetPos.current, step)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, step)
      controlsRef.current.update()
    }
  })

  return null
}

export default function AstronautScene({
  viewMode = 'standard',
  activeZone,
  onSelectZone,
  interactive = false,
}: AstronautSceneProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const defaultZ = isMobile ? 3.5 : 3.1
  const defaultY = isMobile ? -0.22 : -0.20
  const controlsRef = useRef<any>(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, defaultY, defaultZ], fov: isMobile ? 44 : 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        <color attach="background" args={[viewMode === 'xray' ? '#040914' : viewMode === 'thermal' ? '#070a12' : '#08101e']} />
        
        {/* Dynamic Studio Lighting matching active view mode */}
        <ambientLight intensity={viewMode === 'xray' ? 3.0 : viewMode === 'thermal' ? 2.5 : 2.2} />
        <directionalLight position={[3, 5, 4]} intensity={viewMode === 'xray' ? 2.0 : 3.5} color={viewMode === 'xray' ? '#00f3ff' : '#9eeaff'} />
        <directionalLight position={[-3, -1, 2]} intensity={1.8} color="#3b82f6" />
        <pointLight position={[0, 1.5, 2]} intensity={2.2} color={viewMode === 'thermal' ? '#f97316' : '#22d3ee'} />
        <pointLight position={[0, -1, 1]} intensity={1.2} color="#38bdf8" />

        <Suspense fallback={null}>
          <Model
            viewMode={viewMode}
            activeZone={activeZone}
            onSelectZone={onSelectZone}
            interactive={interactive}
          />
        </Suspense>

        <CameraManager
          activeZone={activeZone}
          isMobile={isMobile}
          controlsRef={controlsRef}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={0.8}
          maxDistance={6.0}
          target={[0, defaultY, 0]}
        />
      </Canvas>

      {/* Futuristic Thermal Legend Bar Overlay */}
      {viewMode === 'thermal' && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(5, 10, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '8px 12px',
            zIndex: 10,
            pointerEvents: 'none',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '4px', fontSize: '10px', fontWeight: 700 }}>
            <span style={{ color: '#38bdf8' }}>16°C (LCVG)</span>
            <span style={{ color: '#22c55e' }}>28°C</span>
            <span style={{ color: '#ef4444' }}>38°C (ЯДРО)</span>
          </div>
          <div
            style={{
              width: '180px',
              height: '8px',
              borderRadius: '4px',
              background: 'linear-gradient(to right, #1e1b4b, #2563eb, #06b6d4, #10b981, #eab308, #f97316, #dc2626)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          />
        </div>
      )}

      {/* Futuristic X-Ray Status Overlay */}
      {viewMode === 'xray' && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(5, 10, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '10px',
            padding: '6px 12px',
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#22d3ee',
            fontWeight: 600,
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
          <span>РЕНТГЕН-СКАН · 5 БИОСЕНСОРОВ АКТИВНЫ</span>
        </div>
      )}
    </div>
  )
}

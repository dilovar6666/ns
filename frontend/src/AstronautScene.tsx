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
  { id: 'chest' as const, pos: [0, 1.60, 0.26] as const, label: 'ECG (Chest)', color: '#ff2d55' },
  { id: 'helmet' as const, pos: [0, 2.05, 0.20] as const, label: 'Helmet / Visor', color: '#22d3ee' },
  { id: 'plss' as const, pos: [0, 1.60, -0.38] as const, label: 'PLSS Life Support', color: '#a855f7' },
  { id: 'wrist' as const, pos: [-0.56, 1.22, 0.20] as const, label: 'SpO₂ Wrist', color: '#32ade6' },
  { id: 'lcvg' as const, pos: [0, 0.85, 0.24] as const, label: 'LCVG Cooling Loop', color: '#f59e0b' },
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
  const { scene: rootScene } = useThree()
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF('/models/astronaut.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    // Play idle animation for a clean, upright, perfectly straight and centered astronaut
    const action = actions.idle || actions.floating
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
    // NASA Space Medicine Thermal Profile:
    // Cold loop (18°C) -> Cool limbs/boots (29-31°C) -> Healthy body/legs (32-34°C) -> Hot core (37.5°C)
    grad.addColorStop(0.0, '#0284c7') // Cool PLSS Radiator (18°C)
    grad.addColorStop(0.20, '#06b6d4') // Cyan Coolant Loop (22°C)
    grad.addColorStop(0.38, '#10b981') // Green Limbs / Boots (29°C)
    grad.addColorStop(0.58, '#84cc16') // Warm Green / Thighs & Calves (32°C)
    grad.addColorStop(0.74, '#eab308') // Golden Amber / Normal Skin (34°C)
    grad.addColorStop(0.88, '#f97316') // Warm Orange / Brain & Cranium (36°C)
    grad.addColorStop(1.0, '#dc2626') // Hot Crimson / Cardiac Core (37.5°C)
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
        varying vec3 vNormal;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform sampler2D thermalMap;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        void main() {
          // Baseline healthy astronaut skin temperature: 33.0°C (t ~ 0.65, warm amber/green)
          float t = 0.66;

          // Lower limbs & legs (calves, thighs, boots):
          // Physiologically healthy blood circulation maintains legs at 31.5°C - 34.2°C (warm green to golden amber)
          if (vWorldPos.y < -0.15) {
            float legHeight = clamp((vWorldPos.y - (-1.18)) / 1.05, 0.0, 1.0);
            // From boots (31.0°C ~ 0.46) up to upper thighs (34.5°C ~ 0.72)
            t = mix(0.48, 0.72, legHeight);
          }

          // Cardiac Core & Thorax: metabolic heat center 37.0°C - 37.6°C (bright crimson red)
          float distCore = length(vWorldPos - vec3(0.0, 0.12, 0.10));
          if (distCore < 0.40) {
            float coreFactor = (0.40 - distCore) / 0.40;
            t = mix(t, 0.96, coreFactor * 0.88);
          }

          // Head / Visor exhaled air & facial vascular perfusion: 35.8°C - 36.6°C (warm orange)
          float distHead = length(vWorldPos - vec3(0.0, 0.46, 0.06));
          if (distHead < 0.30) {
            float headFactor = (0.30 - distHead) / 0.30;
            t = mix(t, 0.84, headFactor * 0.75);
          }

          // PLSS Backpack Heat Exchanger / Radiator Sublimator (coolant return: 18°C - 22°C cyan/blue)
          // Located on the backpack behind the astronaut (z < -0.16)
          if (vWorldPos.z < -0.16 && vWorldPos.y > -0.10 && vWorldPos.y < 0.45 && abs(vWorldPos.x) < 0.34) {
            float plssFactor = clamp((-vWorldPos.z - 0.16) / 0.22, 0.0, 1.0);
            t = mix(t, 0.12, plssFactor * 0.90);
          }

          vec4 col = texture2D(thermalMap, vec2(clamp(t, 0.0, 1.0), 0.5));
          gl_FragColor = vec4(col.rgb, 1.0);
        }
      `,
      lights: false,
    })
  }, [])

  // X-Ray Holographic Translucent Suit Shell
  const xrayMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#00e5ff'),
      emissive: new THREE.Color('#002b44'),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.16,
      roughness: 0.2,
      metalness: 0.8,
      depthWrite: false,
    })
  }, [])

  // Skeleton Helper for 90 rigged bones
  const skeletonHelper = useMemo(() => {
    const helper = new THREE.SkeletonHelper(clone)
    helper.material = new THREE.LineBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    })
    return helper
  }, [clone])

  // In Three.js, SkeletonHelper's matrix is set to clone.matrixWorld.
  // It must be added directly to rootScene (not nested inside a transformed group)
  // to avoid double-multiplying the group transform which displaced it outside the body.
  useEffect(() => {
    if (viewMode === 'xray') {
      rootScene.add(skeletonHelper)
      return () => {
        rootScene.remove(skeletonHelper)
      }
    } else {
      rootScene.remove(skeletonHelper)
    }
  }, [viewMode, skeletonHelper, rootScene])

  useFrame((state) => {
    if (group.current) {
      // Natural zero-G microgravity hover while remaining strictly centered on the X axis
      group.current.position.y = -0.78 + Math.sin(state.clock.elapsedTime * 1.3) * 0.02
      group.current.position.x = 0
      // Subtle yaw sway (±0.04 rad = ~2.3 deg)
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.05
      group.current.rotation.x = 0
      group.current.rotation.z = 0
      group.current.updateMatrixWorld(true)
    }
    if (viewMode === 'xray') {
      skeletonHelper.updateMatrixWorld(true)
    }
  })

  const originalMaterials = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map())

  useEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (!originalMaterials.current.has(mesh)) {
          originalMaterials.current.set(mesh, mesh.material)
        }
      }
    })
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
    <group ref={group} position={[0, -0.78, 0]} scale={0.80}>
      <primitive object={clone} />

      {/* Internal Human Skeleton Structure in X-Ray Mode */}
      {viewMode === 'xray' && (
        <group>

          {/* Glowing Anatomical Cranium / Skull */}
          <group position={[0, 2.08, 0.02]}>
            <mesh>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshBasicMaterial color="#a5f3fc" transparent opacity={0.7} wireframe depthTest={false} />
            </mesh>
            <mesh position={[0, -0.06, 0.04]} scale={[0.85, 0.8, 0.9]}>
              <boxGeometry args={[0.09, 0.08, 0.09]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} wireframe depthTest={false} />
            </mesh>
          </group>

          {/* Thoracic Ribcage (Sternum & 8 Rib pairs) */}
          <group position={[0, 1.62, 0.02]}>
            {/* Sternum / Core Column */}
            <mesh position={[0, 0, 0.07]}>
              <cylinderGeometry args={[0.015, 0.015, 0.24, 12]} />
              <meshBasicMaterial color="#e0f2fe" transparent opacity={0.85} depthTest={false} />
            </mesh>
            {/* Rib rings */}
            {[0.09, 0.05, 0.01, -0.03, -0.07].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.14 - Math.abs(y) * 0.35, 0.007, 8, 24, Math.PI * 1.85]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} depthTest={false} />
              </mesh>
            ))}
          </group>

          {/* Vertebral Spine Column */}
          <group position={[0, 1.55, -0.04]}>
            {Array.from({ length: 14 }).map((_, idx) => (
              <mesh key={idx} position={[0, -idx * 0.034 + 0.18, 0]}>
                <cylinderGeometry args={[0.018, 0.02, 0.018, 10]} />
                <meshBasicMaterial color="#a5f3fc" transparent opacity={0.85} depthTest={false} />
              </mesh>
            ))}
          </group>

          {/* Pelvis / Pelvic Girdle */}
          <group position={[0, 1.18, 0.0]}>
            <mesh position={[-0.09, 0.02, 0]} rotation={[0, 0.2, -0.3]}>
              <torusGeometry args={[0.07, 0.01, 8, 16, Math.PI * 1.2]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} depthTest={false} />
            </mesh>
            <mesh position={[0.09, 0.02, 0]} rotation={[0, -0.2, 0.3]}>
              <torusGeometry args={[0.07, 0.01, 8, 16, Math.PI * 1.2]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} depthTest={false} />
            </mesh>
          </group>

          {/* Major Anatomical Joint Nodes */}
          {/* Shoulders */}
          <mesh position={[-0.26, 1.80, 0]}><sphereGeometry args={[0.028, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          <mesh position={[0.26, 1.80, 0]}><sphereGeometry args={[0.028, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          {/* Elbows */}
          <mesh position={[-0.46, 1.50, 0.05]}><sphereGeometry args={[0.022, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          <mesh position={[0.46, 1.50, 0.05]}><sphereGeometry args={[0.022, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          {/* Wrists */}
          <mesh position={[-0.56, 1.22, 0.16]}><sphereGeometry args={[0.018, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          <mesh position={[0.56, 1.22, 0.16]}><sphereGeometry args={[0.018, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          {/* Hips */}
          <mesh position={[-0.14, 1.10, 0]}><sphereGeometry args={[0.026, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          <mesh position={[0.14, 1.10, 0]}><sphereGeometry args={[0.026, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          {/* Knees */}
          <mesh position={[-0.15, 0.62, 0.04]}><sphereGeometry args={[0.024, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          <mesh position={[0.15, 0.62, 0.04]}><sphereGeometry args={[0.024, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          {/* Ankles */}
          <mesh position={[-0.16, 0.16, 0.02]}><sphereGeometry args={[0.020, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
          <mesh position={[0.16, 0.16, 0.02]}><sphereGeometry args={[0.020, 12, 12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.9} depthTest={false} /></mesh>
        </group>
      )}

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
  const targetPos = useRef(new THREE.Vector3(0, 0, isMobile ? 3.3 : 2.9))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))
  const isAnimating = useRef(false)
  const prevZone = useRef<SensorZone | undefined>(activeZone)

  useEffect(() => {
    // Only animate when user actually changes activeZone
    if (activeZone !== prevZone.current) {
      prevZone.current = activeZone
      isAnimating.current = true

      if (!activeZone || activeZone === 'full') {
        targetPos.current.set(0, 0, isMobile ? 3.3 : 2.9)
        targetLook.current.set(0, 0, 0)
      } else {
        switch (activeZone) {
          case 'chest':
            targetPos.current.set(0, 0.50, isMobile ? 1.55 : 1.35)
            targetLook.current.set(0, 0.50, 0)
            break
          case 'helmet':
            targetPos.current.set(0, 0.86, isMobile ? 1.25 : 1.10)
            targetLook.current.set(0, 0.86, 0)
            break
          case 'plss':
            targetPos.current.set(0, 0.50, isMobile ? -1.75 : -1.55)
            targetLook.current.set(0, 0.50, -0.20)
            break
          case 'wrist':
            targetPos.current.set(-0.55, 0.20, isMobile ? 1.10 : 0.90)
            targetLook.current.set(-0.45, 0.20, 0.10)
            break
          case 'lcvg':
            targetPos.current.set(0, -0.10, isMobile ? 2.60 : 2.30)
            targetLook.current.set(0, -0.10, 0)
            break
        }
      }
    }
  }, [activeZone, isMobile])

  // Stop camera animation as soon as user starts manually dragging/rotating
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const onStart = () => {
      isAnimating.current = false
    }
    controls.addEventListener('start', onStart)
    return () => {
      controls.removeEventListener('start', onStart)
    }
  }, [controlsRef])

  useFrame((_, delta) => {
    if (!isAnimating.current) return

    const step = Math.min(1, delta * 3.5)
    camera.position.lerp(targetPos.current, step)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, step)
      controlsRef.current.update()
    }

    // Stop animating once close enough to target
    if (
      camera.position.distanceTo(targetPos.current) < 0.015 &&
      (!controlsRef.current || controlsRef.current.target.distanceTo(targetLook.current) < 0.015)
    ) {
      isAnimating.current = false
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
  const defaultZ = isMobile ? 3.3 : 2.9
  const defaultY = 0.0
  const controlsRef = useRef<any>(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, defaultY, defaultZ], fov: isMobile ? 42 : 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, touchAction: 'none' }}
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
          makeDefault
          enableRotate={true}
          enableZoom={true}
          enablePan={false}
          rotateSpeed={0.85}
          zoomSpeed={0.95}
          minDistance={0.5}
          maxDistance={7.0}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Futuristic Thermal Legend Bar Overlay */}
      {viewMode === 'thermal' && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(5, 10, 18, 0.88)',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '4px', fontSize: '9px', fontWeight: 700, gap: '8px' }}>
            <span style={{ color: '#0284c7' }}>18°C PLSS</span>
            <span style={{ color: '#10b981' }}>31°C Extremities</span>
            <span style={{ color: '#eab308' }}>34°C Body Torso</span>
            <span style={{ color: '#ef4444' }}>37.5°C Core Vitals</span>
          </div>
          <div
            style={{
              width: '200px',
              maxWidth: 'calc(100vw - 60px)',
              height: '8px',
              borderRadius: '4px',
              background: 'linear-gradient(to right, #0284c7, #06b6d4, #10b981, #84cc16, #eab308, #f97316, #dc2626)',
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
            background: 'rgba(5, 10, 18, 0.88)',
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
          <span>X-RAY SCAN · SKELETAL RIG + 5 BIOSENSORS</span>
        </div>
      )}
    </div>
  )
}

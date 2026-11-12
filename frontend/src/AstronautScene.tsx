import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei'
import type { Group } from 'three'

function Model() {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF('/models/astronaut.glb')
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    const action = actions.floating || actions.idle
    action?.play()
    return () => {
      action?.stop()
    }
  }, [actions])

  return (
    <group ref={group} position={[0, -1.22, 0]}>
      <primitive object={scene} scale={0.80} />
    </group>
  )
}

export default function AstronautScene() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const cameraZ = isMobile ? 3.7 : 3.3
  const cameraY = isMobile ? -0.15 : -0.1

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, cameraY, cameraZ], fov: isMobile ? 44 : 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        <color attach="background" args={['#08101e']} />
        <ambientLight intensity={2.2} />
        <directionalLight position={[3, 5, 4]} intensity={3.5} color="#9eeaff" />
        <directionalLight position={[-3, -1, 2]} intensity={1.8} color="#3b82f6" />
        <pointLight position={[0, 1.5, 2]} intensity={2.2} color="#22d3ee" />
        <pointLight position={[0, -1, 1]} intensity={1.2} color="#38bdf8" />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.8}
          maxDistance={5.5}
          target={[0, cameraY, 0]}
        />
      </Canvas>
    </div>
  )
}

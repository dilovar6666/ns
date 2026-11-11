import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei'
import type { Group } from 'three'

function Model() {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF('/models/astronaut.glb')
  const { actions } = useAnimations(animations, group)
  useEffect(() => { const action = actions.floating || actions.idle; action?.play(); return () => { action?.stop() } }, [actions])
  return <group ref={group}><primitive object={scene} scale={1} /></group>
}

export default function AstronautScene() {
  return <Canvas camera={{ position: [0, 1.8, 5.5], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
    <color attach="background" args={['#0b1322']} />
    <ambientLight intensity={1.8} />
    <directionalLight position={[3, 5, 4]} intensity={3} color="#9eeaff" />
    <pointLight position={[-3, 1, -2]} intensity={2} color="#22d3ee" />
    <Suspense fallback={null}><Model /></Suspense>
    <OrbitControls enablePan minDistance={2} maxDistance={10} target={[0, 1.5, 0]} />
  </Canvas>
}

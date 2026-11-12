import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { Group } from "three";

function HelmetOnlyModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF("/models/astronaut.glb");

  // Subtle natural floating & breathing movement
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = -2.06 + Math.sin(state.clock.elapsedTime * 1.4) * 0.015;
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.12;
    }
  });

  return (
    // Position -2.06m places the astronaut's head/helmet center precisely at [0, 0, 0]
    <group ref={group} position={[0, -2.06, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export function AstronautProfileCanvas() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "transparent",
        overflow: "hidden",
        cursor: "grab",
      }}
    >
      <Canvas
        // Camera placed 0.86m away focusing exclusively on the helmet/visor
        camera={{ position: [0, 0.02, 0.86], fov: 29 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        {/* Crisp space studio lighting highlighting the helmet visor, reflections and helmet contours */}
        <ambientLight intensity={1.6} />
        <directionalLight position={[2.5, 3.0, 2.5]} intensity={3.0} color="#ffffff" />
        <directionalLight position={[-2.5, 1.5, 1.5]} intensity={2.0} color="#60a5fa" />
        <pointLight position={[0, -1.0, 1.0]} intensity={1.4} color="#38bdf8" />
        <pointLight position={[0, 2.0, -1.5]} intensity={2.0} color="#818cf8" />

        <Suspense fallback={null}>
          <HelmetOnlyModel />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          rotateSpeed={0.7}
          target={[0, 0.02, 0]}
          minDistance={0.5}
          maxDistance={1.4}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 0.72}
        />
      </Canvas>
    </div>
  );
}

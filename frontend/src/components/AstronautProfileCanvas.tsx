import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { Group } from "three";

function HelmetModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF("/models/astronaut.glb");

  // Subtle breathing/floating animation
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
  });

  return (
    <group ref={group} position={[0, -0.4, 0]}>
      <primitive object={scene} scale={1.25} />
    </group>
  );
}

export function AstronautProfileCanvas() {
  const controlsRef = useRef<any>(null);

  const resetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 1.65, 2.5], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[2, 4, 3]} intensity={2.8} color="#ffffff" />
        <pointLight position={[-2, 2, 1]} intensity={2.2} color="#38bdf8" />
        <pointLight position={[2, 0.5, -1]} intensity={1.8} color="#818cf8" />
        <Suspense fallback={null}>
          <HelmetModel />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          minDistance={1.4}
          maxDistance={5}
          target={[0, 1.55, 0]}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 3.5}
        />
      </Canvas>

      {/* Floating control hint and reset button */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 10,
          background: "rgba(11, 19, 34, 0.75)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "20px",
          padding: "4px 10px",
          fontSize: "11px",
          color: "var(--t2)",
          userSelect: "none",
        }}
      >
        <span>⟲ Вращайте 3D-модель</span>
        <button
          onClick={resetView}
          style={{
            background: "none",
            border: "none",
            color: "var(--pr)",
            cursor: "pointer",
            fontWeight: 700,
            padding: 0,
            fontSize: "11px",
          }}
          title="Сбросить ракурс камеры"
        >
          Сброс
        </button>
      </div>
    </div>
  );
}

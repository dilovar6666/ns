import React, { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Group } from "three";

function HelmetOnlyModel() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/astronaut.glb");
  const clone = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    cloned.scale.set(0.8, 0.8, 0.8);
    return cloned;
  }, [scene]);

  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play idle animation so the astronaut stands naturally with arms down at sides instead of T-pose
    const action = actions.idle || actions.floating;
    if (action) {
      action.reset().play();
    }
    return () => {
      action?.stop();
    };
  }, [actions]);

  // Subtle natural floating & breathing movement
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = -1.65 + Math.sin(state.clock.elapsedTime * 1.4) * 0.012;
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.12;
    }
  });

  return (
    // Position -1.65m places the 0.8-scaled astronaut's head/helmet center precisely at [0, 0, 0]
    <group ref={group} position={[0, -1.65, 0]}>
      <primitive object={clone} />
    </group>
  );
}

export function AstronautProfileCanvas() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const cameraZ = isMobile ? 1.08 : 0.96;
  const cameraFov = isMobile ? 32 : 30;

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
        camera={{ position: [0, 0.02, cameraZ], fov: cameraFov }}
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
          enableZoom={false}
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

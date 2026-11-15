import React, { Suspense, useRef, useMemo, useEffect, useState, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Html } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Group } from "three";

// Preload the astronaut asset
useGLTF.preload("/models/astronaut.glb");

function CanvasLoader({ label = "CALIBRATING 3D VISOR..." }: { label?: string }) {
  return (
    <Html center>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "2px solid rgba(56, 189, 248, 0.2)",
            borderTopColor: "#38bdf8",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.2px",
            color: "#38bdf8",
            textTransform: "uppercase",
            fontFamily: "Space Grotesk, monospace",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      </div>
    </Html>
  );
}

function HelmetOnlyModel() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/astronaut.glb");
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
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
      group.current.position.y = -1.64 + Math.sin(state.clock.elapsedTime * 1.4) * 0.012;
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.12;
    }
  });

  return (
    // Position -1.64m with scale 0.82 centers the helmet precisely at [0, 0.05, 0]
    <group ref={group} position={[0, -1.64, 0]} scale={0.82}>
      <primitive object={clone} />
    </group>
  );
}

// Error Boundary with NASA HUD Holographic Avatar Fallback
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("3D Helmet Canvas Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle at center, rgba(56, 189, 248, 0.08) 0%, transparent 70%)",
            borderRadius: "20px",
            border: "1px dashed rgba(56, 189, 248, 0.3)",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              border: "2px solid rgba(56, 189, 248, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              color: "#38bdf8",
              boxShadow: "0 0 25px rgba(56, 189, 248, 0.2)",
            }}
          >
            🧑‍🚀
          </div>
          <span
            style={{
              marginTop: "14px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1px",
              color: "#38bdf8",
              textTransform: "uppercase",
              fontFamily: "Space Grotesk, monospace",
            }}
          >
            EVA EMU SUIT · ACTIVE
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", marginTop: "4px" }}>
            Biometric Telemetry Online
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AstronautProfileCanvas() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const cameraZ = isMobile ? 1.25 : 1.10;
  const cameraFov = isMobile ? 36 : 32;

  return (
    <CanvasErrorBoundary>
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "340px",
          position: "relative",
          background: "transparent",
          overflow: "visible",
          cursor: "grab",
        }}
      >
        <Canvas
          camera={{ position: [0, 0.06, cameraZ], fov: cameraFov }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
        >
          {/* Crisp space studio lighting highlighting helmet visor, reflections and contours */}
          <ambientLight intensity={1.8} />
          <directionalLight position={[2.5, 3.0, 2.5]} intensity={3.2} color="#ffffff" />
          <directionalLight position={[-2.5, 1.5, 1.5]} intensity={2.2} color="#60a5fa" />
          <pointLight position={[0, -0.8, 1.0]} intensity={1.6} color="#38bdf8" />
          <pointLight position={[0, 2.0, -1.5]} intensity={2.2} color="#818cf8" />

          <Suspense fallback={<CanvasLoader label="INITIALIZING 3D DOSSIER..." />}>
            <HelmetOnlyModel />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.7}
            target={[0, 0.06, 0]}
            minDistance={0.5}
            maxDistance={1.6}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI * 0.72}
          />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface EarthProps {
  onLoaded?: () => void;
}

const FLY_DURATION = 3.6;

function CameraFlyAndOrbit() {
  const { camera } = useThree();
  const [flyComplete, setFlyComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  useFrame((state) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;

    if (elapsed < FLY_DURATION) {
      const p = Math.min(elapsed / FLY_DURATION, 1.0);
      // Quintic ease-out for dramatic deceleration as we reach Earth orbit
      const ease = 1.0 - Math.pow(1.0 - p, 3.8);

      // Start far in deep space at z = 18.0 and fly into orbital observation distance z = 4.6
      const startZ = 18.0;
      const targetZ = 4.6;
      camera.position.z = startZ + (targetZ - startZ) * ease;

      const startY = 1.4;
      const targetY = 0.0;
      camera.position.y = startY + (targetY - startY) * ease;

      const startX = 0.35;
      const targetX = 0.0;
      camera.position.x = startX + (targetX - startX) * ease;

      camera.lookAt(0, 0, 0);
    } else if (!flyComplete) {
      camera.position.set(0, 0, 4.6);
      camera.lookAt(0, 0, 0);
      setFlyComplete(true);
    }
  });

  return flyComplete ? (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      rotateSpeed={0.6}
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI * 0.8}
    />
  ) : null;
}

function EarthGlobe({ onLoaded }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load 8k textures
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  const [dayTex, nightTex, cloudsTex, specTex] = useMemo(() => {
    const day = textureLoader.load("/models/earth/textures/8k_earth_daymap.jpeg");
    const night = textureLoader.load("/models/earth/textures/8k_earth_nightmap.jpg");
    const clouds = textureLoader.load("/models/earth/textures/8k_earth_clouds.jpeg");
    const spec = textureLoader.load("/models/earth/textures/8k_earth_specular_map.png");

    [day, night, clouds, spec].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
    });

    return [day, night, clouds, spec];
  }, [textureLoader]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  // Sun direction: lights up the right-front side (visible blue oceans, clouds & specular reflection)
  // while the left-back side displays golden city night lights across the terminator.
  const sunDir = useMemo(() => new THREE.Vector3(1.8, 0.6, 1.0).normalize(), []);

  // Earth shader material with smooth day-night terminator, specular oceans, and Rayleigh rim glow
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTex },
        nightTexture: { value: nightTex },
        specularTexture: { value: specTex },
        sunDirection: { value: sunDir },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vPosition = mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D specularTexture;
        uniform vec3 sunDirection;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 sun = normalize(sunDirection);
          float nDotL = dot(normal, sun);

          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec4 specMap = texture2D(specularTexture, vUv);

          // Terminator smoothing
          float dayFactor = smoothstep(-0.15, 0.25, nDotL);

          // Specular highlight on water
          vec3 viewDir = normalize(-vPosition);
          vec3 halfVec = normalize(sun + viewDir);
          float spec = pow(max(dot(normal, halfVec), 0.0), 32.0) * specMap.r * 1.8;

          // Atmospheric Fresnel rim glow
          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.2);
          vec3 atmoGlow = vec3(0.18, 0.74, 1.0) * fresnel * max(nDotL + 0.35, 0.0) * 1.35;

          // Golden night city lights
          vec3 nightLights = nightColor.rgb * vec3(1.35, 1.2, 0.95) * 2.4;

          vec3 finalColor = mix(nightLights, dayColor.rgb + vec3(spec), dayFactor) + atmoGlow;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [dayTex, nightTex, specTex, sunDir]);

  // Cloud layer shader material
  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        cloudTexture: { value: cloudsTex },
        sunDirection: { value: sunDir },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D cloudTexture;
        uniform vec3 sunDirection;

        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec4 cloud = texture2D(cloudTexture, vUv);
          float nDotL = max(dot(normalize(vNormal), normalize(sunDirection)), 0.0);
          float light = clamp(nDotL * 1.15 + 0.1, 0.1, 1.0);
          gl_FragColor = vec4(cloud.rgb * light, cloud.r * 0.75);
        }
      `,
    });
  }, [cloudsTex, sunDir]);

  // Outer Atmosphere glow
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vPosition = mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.72 - dot(normalize(vNormal), viewDir), 2.2);
          gl_FragColor = vec4(0.22, 0.8, 1.0, 1.0) * intensity * 1.6;
        }
      `,
    });
  }, []);

  // Animation frame loop:
  // Starts fast spinning when camera is far away, smoothly decelerates as camera approaches,
  // then keeps spinning continuously at cruising orbital speed.
  useFrame((state, delta) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;

    let spinSpeed = 0.045; // standard steady orbital rotation
    if (elapsed < FLY_DURATION) {
      const p = Math.min(elapsed / FLY_DURATION, 1.0);
      const fastInitialSpeed = 4.2; // fast spin in deep space
      const cruisingSpeed = 0.045;
      const decel = Math.pow(1.0 - p, 2.5);
      spinSpeed = cruisingSpeed + (fastInitialSpeed - cruisingSpeed) * decel;
    }

    if (earthRef.current) {
      earthRef.current.rotation.y += delta * spinSpeed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * (spinSpeed * 1.15);
    }

    // Subtle pointer parallax tilt once settled
    if (groupRef.current && elapsed >= FLY_DURATION) {
      const mouseX = state.pointer.x * 0.12;
      const mouseY = state.pointer.y * 0.10;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY, 0.04);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, mouseX * 0.35, 0.04);
    }
  });

  return (
    <group ref={groupRef} position={[-0.08, 0, 0]} rotation={[0.2, 3.6, 0.15]}>
      {/* Base Earth Sphere - perfectly sized to fit inside viewport */}
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[1.20, 64, 64]} />
      </mesh>

      {/* Cloud Sphere */}
      <mesh ref={cloudsRef} material={cloudMaterial}>
        <sphereGeometry args={[1.212, 64, 64]} />
      </mesh>

      {/* Atmosphere Outer Glow */}
      <mesh ref={atmosphereRef} material={atmosphereMaterial}>
        <sphereGeometry args={[1.285, 64, 64]} />
      </mesh>
    </group>
  );
}

export function EarthCanvas() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "auto",
        zIndex: 1,
      }}
    >
      <Canvas
        camera={{ position: [0.35, 1.4, 18.0], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <CameraFlyAndOrbit />
        <EarthGlobe />
      </Canvas>
    </div>
  );
}

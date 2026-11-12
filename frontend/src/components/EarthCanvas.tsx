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
      // Quintic ease-out for majestic deceleration as we reach Earth orbit
      const ease = 1.0 - Math.pow(1.0 - p, 3.8);

      // Start far in deep space at z = 16.0, x = 0.6, y = 1.0 and fly into final position z = 4.4
      const startZ = 16.0;
      const targetZ = 4.4;
      camera.position.z = startZ + (targetZ - startZ) * ease;

      const startY = 1.0;
      const targetY = 0.0;
      camera.position.y = startY + (targetY - startY) * ease;

      const startX = 0.6;
      const targetX = 0.0;
      camera.position.x = startX + (targetX - startX) * ease;

      camera.lookAt(0, 0, 0);
    } else if (!flyComplete) {
      camera.position.set(0, 0, 4.4);
      camera.lookAt(0, 0, 0);
      setFlyComplete(true);
    }
  });

  return flyComplete ? (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      rotateSpeed={0.5}
      minPolarAngle={Math.PI * 0.25}
      maxPolarAngle={Math.PI * 0.75}
    />
  ) : null;
}

function EarthGlobe({ onLoaded }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);
  const sunAngleRef = useRef<number>(0.8);

  // Dynamic vector for orbiting sun
  const dynamicSunDir = useMemo(() => new THREE.Vector3(1.8, 0.4, 1.0).normalize(), []);

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

  // Earth shader material: natural Rayleigh atmosphere only on sun-facing limb,
  // delicate ocean specular glint, and realistic city lights on the dark night side.
  // NO artificial glowing neon ring!
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTex },
        nightTexture: { value: nightTex },
        specularTexture: { value: specTex },
        sunDirection: { value: dynamicSunDir },
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

          // Smooth day-night terminator transition
          float dayFactor = smoothstep(-0.12, 0.22, nDotL);

          // Specular highlight on water - natural subtle ocean glint
          vec3 viewDir = normalize(-vPosition);
          vec3 halfVec = normalize(sun + viewDir);
          float spec = pow(max(dot(normal, halfVec), 0.0), 38.0) * specMap.r * 0.75;

          // Atmospheric limb glow - strictly visible on sun-illuminated side only!
          // The night side fades cleanly into the black void of space.
          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.2);
          float sunLit = max(nDotL + 0.1, 0.0);
          vec3 atmoGlow = vec3(0.24, 0.62, 1.0) * fresnel * sunLit * 0.95;

          // Realistic night city lights on the dark hemisphere
          vec3 nightLights = nightColor.rgb * vec3(1.3, 1.15, 0.9) * 2.1;

          vec3 finalColor = mix(nightLights, dayColor.rgb + vec3(spec), dayFactor) + atmoGlow;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [dayTex, nightTex, specTex, dynamicSunDir]);

  // Cloud layer shader material with moving sun illumination
  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        cloudTexture: { value: cloudsTex },
        sunDirection: { value: dynamicSunDir },
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
          float light = clamp(nDotL * 1.25, 0.04, 1.0);
          gl_FragColor = vec4(cloud.rgb * light, cloud.r * 0.72);
        }
      `,
    });
  }, [cloudsTex, dynamicSunDir]);

  // Animation frame loop:
  // 1. Earth spins on its Y axis: starts fast when camera is far, decelerates to steady speed.
  // 2. Clouds drift at a slightly different speed.
  // 3. Sun dynamically orbits around the Earth so lighting and day/night continuously cycle!
  useFrame((state, delta) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;

    let spinSpeed = 0.038;
    if (elapsed < FLY_DURATION) {
      const p = Math.min(elapsed / FLY_DURATION, 1.0);
      const fastInitialSpeed = 3.6;
      const cruisingSpeed = 0.038;
      const decel = Math.pow(1.0 - p, 2.5);
      spinSpeed = cruisingSpeed + (fastInitialSpeed - cruisingSpeed) * decel;
    }

    // 1. Earth spin
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * spinSpeed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * (spinSpeed * 1.08);
    }

    // 2. Sun orbits around the Earth so the sun position is not static!
    sunAngleRef.current += delta * 0.16; // gradual continuous day/night orbital cycle
    const sx = Math.cos(sunAngleRef.current) * 2.0;
    const sz = Math.sin(sunAngleRef.current) * 2.0;
    const sy = 0.45 * Math.sin(sunAngleRef.current * 0.5);
    dynamicSunDir.set(sx, sy, sz).normalize();

    // 3. Subtle pointer parallax tilt once settled
    if (groupRef.current && elapsed >= FLY_DURATION) {
      const mouseX = state.pointer.x * 0.08;
      const mouseY = state.pointer.y * 0.06;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY, 0.04);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, mouseX * 0.2, 0.04);
    }
  });

  return (
    // Large Earth with radius 1.80 placed at x = -0.95 so only the curved half is visible on the left!
    <group ref={groupRef} position={[-0.95, 0, 0]} rotation={[0.2, 3.4, 0.12]}>
      {/* Base Earth Sphere */}
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[1.80, 64, 64]} />
      </mesh>

      {/* Cloud Sphere */}
      <mesh ref={cloudsRef} material={cloudMaterial}>
        <sphereGeometry args={[1.815, 64, 64]} />
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
        camera={{ position: [0.6, 1.0, 16.0], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ambientLight intensity={0.25} />
        <CameraFlyAndOrbit />
        <EarthGlobe />
      </Canvas>
    </div>
  );
}

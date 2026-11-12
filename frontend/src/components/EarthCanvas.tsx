import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EarthProps {
  onLoaded?: () => void;
}

function EarthGlobe({ onLoaded }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

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

  // Sun direction: pointing from top-right-front towards earth
  // This lights up the eastern hemisphere rim while leaving camera-facing side as night
  const sunDir = useMemo(() => new THREE.Vector3(2.4, 0.8, -1.2).normalize(), []);

  // Earth shader material
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
          float dayFactor = smoothstep(-0.12, 0.22, nDotL);

          // Specular highlight on water
          vec3 viewDir = normalize(-vPosition);
          vec3 halfVec = normalize(sun + viewDir);
          float spec = pow(max(dot(normal, halfVec), 0.0), 28.0) * specMap.r * 1.6;

          // Atmospheric Fresnel rim glow
          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.2);
          vec3 atmoGlow = vec3(0.15, 0.72, 1.0) * fresnel * max(nDotL + 0.35, 0.0) * 1.2;

          // Golden night city lights
          vec3 nightLights = nightColor.rgb * vec3(1.35, 1.2, 0.95) * 2.2;

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
          float light = clamp(nDotL * 1.1 + 0.1, 0.1, 1.0);
          gl_FragColor = vec4(cloud.rgb * light, cloud.r * 0.7);
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
          float intensity = pow(0.68 - dot(normalize(vNormal), viewDir), 2.2);
          gl_FragColor = vec4(0.2, 0.78, 1.0, 1.0) * intensity * 1.5;
        }
      `,
    });
  }, []);

  // Animation frame loop: Earth spins slowly, clouds drift
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.035;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.045;
    }
    // Subtle mouse tilt for depth parallax
    if (groupRef.current) {
      const mouseX = state.pointer.x * 0.15;
      const mouseY = state.pointer.y * 0.12;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseX, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[-0.35, 0, 0]} rotation={[0.2, 3.8, 0.15]}>
      {/* Base Earth Sphere */}
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[2.0, 64, 64]} />
      </mesh>

      {/* Cloud Sphere */}
      <mesh ref={cloudsRef} material={cloudMaterial}>
        <sphereGeometry args={[2.016, 64, 64]} />
      </mesh>

      {/* Atmosphere Outer Glow */}
      <mesh ref={atmosphereRef} material={atmosphereMaterial}>
        <sphereGeometry args={[2.14, 64, 64]} />
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
        camera={{ position: [0, 0, 4.4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <EarthGlobe />
      </Canvas>
    </div>
  );
}

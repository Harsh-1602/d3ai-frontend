import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Torus, Octahedron, Icosahedron, Line } from '@react-three/drei';
import * as THREE from 'three';

export const DiseaseAnalysis = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group ref={ref}>
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#6366f1"
          emissive="#4338ca"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={i}
          args={[0.2, 0.2, 0.2]}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 2,
            Math.sin((i / 8) * Math.PI * 2) * 2,
            0,
          ]}
        >
          <meshStandardMaterial
            color="#ec4899"
            emissive="#be185d"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </Box>
      ))}
    </group>
  );
};

export const CandidateSearch = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Torus
          key={i}
          args={[1 - i * 0.15, 0.1, 16, 32]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={i % 2 ? "#6366f1" : "#ec4899"}
            emissive={i % 2 ? "#4338ca" : "#be185d"}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </Torus>
      ))}
    </group>
  );
};

export const MoleculeGen = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.z = Math.sin(state.clock.getElapsedTime()) * 0.3;
    }
  });

  return (
    <group ref={ref}>
      <Octahedron args={[1]}>
        <meshStandardMaterial
          color="#10b981"
          emissive="#059669"
          emissiveIntensity={0.5}
          wireframe
          metalness={0.8}
          roughness={0.2}
        />
      </Octahedron>
      {Array.from({ length: 6 }).map((_, i) => (
        <Sphere
          key={i}
          args={[0.2, 16, 16]}
          position={[
            Math.cos((i / 6) * Math.PI * 2) * 1.5,
            Math.sin((i / 6) * Math.PI * 2) * 1.5,
            0,
          ]}
        >
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#1d4ed8"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </Sphere>
      ))}
    </group>
  );
};

export const PropertyAnalysis = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
    }
  });

  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 100; i++) {
    const t = i / 100;
    points.push(
      new THREE.Vector3(
        Math.cos(t * Math.PI * 4) * (1 + t),
        Math.sin(t * Math.PI * 4) * (1 + t),
        t * 2 - 1
      )
    );
  }

  return (
    <group ref={ref}>
      <Line
        points={points}
        color="#3b82f6"
        lineWidth={3}
      />
      {Array.from({ length: 10 }).map((_, i) => (
        <Box
          key={i}
          args={[0.2, 0.2, 0.2]}
          position={[
            points[i * 10].x,
            points[i * 10].y,
            points[i * 10].z,
          ]}
        >
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </Box>
      ))}
    </group>
  );
};

export const Optimization = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Icosahedron
          key={i}
          args={[1 - i * 0.3, 1]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={i === 0 ? "#f59e0b" : i === 1 ? "#10b981" : "#3b82f6"}
            emissive={i === 0 ? "#d97706" : i === 1 ? "#059669" : "#1d4ed8"}
            emissiveIntensity={0.5}
            wireframe={i !== 0}
            metalness={0.8}
            roughness={0.2}
          />
        </Icosahedron>
      ))}
    </group>
  );
};

export const Results = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.z = Math.sin(state.clock.getElapsedTime()) * 0.2;
    }
  });

  return (
    <group ref={ref}>
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      {Array.from({ length: 12 }).map((_, i) => (
        <Box
          key={i}
          args={[0.1, 0.5, 0.1]}
          position={[
            Math.cos((i / 12) * Math.PI * 2) * 1.5,
            Math.sin((i / 12) * Math.PI * 2) * 1.5,
            0,
          ]}
          rotation={[0, 0, (i / 12) * Math.PI * 2]}
        >
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4338ca"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </Box>
      ))}
    </group>
  );
}; 
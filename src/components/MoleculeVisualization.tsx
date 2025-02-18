import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

interface Atom {
  position: [number, number, number];
  color: string;
}

interface Bond {
  start: [number, number, number];
  end: [number, number, number];
}

const MoleculeVisualization = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  // Create a simple molecule structure
  const atoms: Atom[] = [
    { position: [0, 0, 0], color: '#6366f1' },
    { position: [2, 0, 0], color: '#ec4899' },
    { position: [1, 1.5, 0], color: '#10b981' },
    { position: [1, -1.5, 0], color: '#3b82f6' },
    { position: [-1, 1, 0], color: '#f59e0b' },
    { position: [-1, -1, 0], color: '#ef4444' },
  ];

  const bonds: Bond[] = [
    { start: [0, 0, 0], end: [2, 0, 0] },
    { start: [1, 1.5, 0], end: [0, 0, 0] },
    { start: [1, -1.5, 0], end: [0, 0, 0] },
    { start: [-1, 1, 0], end: [0, 0, 0] },
    { start: [-1, -1, 0], end: [0, 0, 0] },
  ];

  return (
    <group ref={groupRef}>
      {atoms.map((atom, index) => (
        <group key={index} position={atom.position}>
          <Sphere args={[0.4, 32, 32]}>
            <meshStandardMaterial
              color={atom.color}
              emissive={atom.color}
              emissiveIntensity={0.2}
              roughness={0.2}
              metalness={0.8}
            />
          </Sphere>
        </group>
      ))}
      {bonds.map((bond, index) => (
        <Line
          key={index}
          points={[
            new THREE.Vector3(...bond.start),
            new THREE.Vector3(...bond.end)
          ]}
          color="white"
          lineWidth={3}
          opacity={0.6}
          transparent
        />
      ))}
    </group>
  );
};

export default MoleculeVisualization; 
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, PointerLockControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FLOORS, FLOOR_HEIGHT, ROOM_COLORS, ROOMS, type Room } from "@/lib/campus-data";

interface ViewerProps {
  activeFloor: number;
  selectedId: string | null;
  onSelect: (room: Room) => void;
  mode: "orbit" | "walk";
}

function RoomMesh({
  room,
  dimmed,
  selected,
  onSelect,
  showLabel,
}: {
  room: Room;
  dimmed: boolean;
  selected: boolean;
  onSelect: (room: Room) => void;
  showLabel: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const height = 3;
  const y = room.floor * FLOOR_HEIGHT + height / 2;
  const color = ROOM_COLORS[room.type];
  const risky = room.fireRisk === "alert";

  return (
    <group position={[room.x, y, room.z]}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(room);
        }}
      >
        <boxGeometry args={[room.w, height, room.d]} />
        <meshStandardMaterial
          color={risky ? "#ff5a52" : color}
          transparent
          opacity={dimmed ? 0.08 : selected ? 0.85 : hovered ? 0.62 : 0.4}
          emissive={new THREE.Color(selected ? "#ffffff" : risky ? "#ff3b30" : color)}
          emissiveIntensity={dimmed ? 0 : selected ? 0.5 : hovered ? 0.3 : 0.12}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(room.w, height, room.d)]} />
        <lineBasicMaterial
          color={selected ? "#ffffff" : risky ? "#ff6b63" : color}
          transparent
          opacity={dimmed ? 0.12 : 0.9}
        />
      </lineSegments>
      {showLabel && (
        <Html center position={[0, height / 2 + 0.9, 0]} distanceFactor={26} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-md border border-border bg-background/85 px-2 py-0.5 text-[11px] font-medium text-foreground">
            {room.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function FloorSlab({ level, dimmed }: { level: number; dimmed: boolean }) {
  return (
    <mesh
      receiveShadow
      rotation-x={-Math.PI / 2}
      position={[-2, level * FLOOR_HEIGHT - 0.05, 0]}
    >
      <planeGeometry args={[36, 22]} />
      <meshStandardMaterial
        color="#16202f"
        transparent
        opacity={dimmed ? 0.18 : 0.95}
        roughness={0.9}
      />
    </mesh>
  );
}

function WalkRig({ enabled, floor }: { enabled: boolean; floor: number }) {
  const keys = useRef<Record<string, boolean>>({});
  const { camera } = useThree();

  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current = {};
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) camera.position.set(-2, floor * FLOOR_HEIGHT + 1.7, 14);
  }, [enabled, floor, camera]);

  useFrame((_, rawDelta) => {
    if (!enabled) return;
    const dt = Math.min(rawDelta, 0.05);
    const speed = (keys.current["ShiftLeft"] ? 12 : 6) * dt;
    const dir = new THREE.Vector3();
    const side = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    side.crossVectors(dir, new THREE.Vector3(0, 1, 0));

    if (keys.current["KeyW"] || keys.current["ArrowUp"]) camera.position.addScaledVector(dir, speed);
    if (keys.current["KeyS"] || keys.current["ArrowDown"])
      camera.position.addScaledVector(dir, -speed);
    if (keys.current["KeyD"] || keys.current["ArrowRight"])
      camera.position.addScaledVector(side, speed);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"])
      camera.position.addScaledVector(side, -speed);

    camera.position.y = floor * FLOOR_HEIGHT + 1.7;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -22, 18);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -16, 16);
  });

  return null;
}

function Scene({ activeFloor, selectedId, onSelect, mode }: ViewerProps) {
  const rooms = useMemo(() => ROOMS, []);
  return (
    <>
      <color attach="background" args={["#0b1220"]} />
      <fog attach="fog" args={["#0b1220", 40, 110]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#7fe7ff", "#0b1220", 0.6]} />
      <directionalLight
        position={[18, 26, 14]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-14, 10, -10]} intensity={40} color="#8b5cf6" distance={60} />

      <gridHelper args={[90, 45, "#1f3b52", "#152535"]} position={[0, -0.2, 0]} />

      {FLOORS.map((f) => (
        <FloorSlab key={f.level} level={f.level} dimmed={f.level !== activeFloor} />
      ))}

      {rooms.map((room) => (
        <RoomMesh
          key={room.id}
          room={room}
          dimmed={room.floor !== activeFloor}
          selected={room.id === selectedId}
          onSelect={onSelect}
          showLabel={room.floor === activeFloor && mode === "orbit"}
        />
      ))}

      {mode === "orbit" ? (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={10}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2.1}
          target={[-2, activeFloor * FLOOR_HEIGHT + 2, 0]}
        />
      ) : (
        <>
          <PointerLockControls makeDefault />
          <WalkRig enabled floor={activeFloor} />
        </>
      )}
    </>
  );
}

export default function BuildingViewer(props: ViewerProps) {
  return (
    <Canvas shadows camera={{ position: [22, 20, 30], fov: 55 }} dpr={[1, 2]}>
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}

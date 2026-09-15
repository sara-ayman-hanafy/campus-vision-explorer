import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Zap,
  DoorOpen,
} from "lucide-react";
import { FLOORS, FLOOR_HEIGHT, ROOM_COLORS, ROOMS, type Room } from "@/lib/campus-data";

interface ViewerProps {
  activeFloor: number;
  selectedId: string | null;
  onSelect: (room: Room) => void;
  mode: "orbit" | "walk";
}

/** shared mutable control state between DOM buttons and the render loop */
interface Controls {
  fwd: number;
  strafe: number;
  turn: number;
  run: boolean;
  target: { x: number; z: number } | null;
}

const WALL_H = 3;
const EYE = 1.7;
const DOOR = 2.4;

/* ---------------------------------- textures --------------------------------- */

function makeFloorTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#16202f";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  g.strokeStyle = "rgba(125,220,255,0.16)";
  g.lineWidth = 2;
  for (let i = 0; i <= 256; i += 64) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 256);
    g.moveTo(0, i);
    g.lineTo(256, i);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(9, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeWallTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1c2838";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  g.fillStyle = "rgba(255,255,255,0.05)";
  g.fillRect(0, 210, 256, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------- orbit geometry ------------------------------ */

function RoomBlock({
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
  const y = room.floor * FLOOR_HEIGHT + WALL_H / 2;
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
        <boxGeometry args={[room.w, WALL_H, room.d]} />
        <meshPhysicalMaterial
          color={risky ? "#ff5a52" : color}
          transparent
          opacity={dimmed ? 0.07 : selected ? 0.8 : hovered ? 0.58 : 0.34}
          emissive={new THREE.Color(selected ? "#ffffff" : risky ? "#ff3b30" : color)}
          emissiveIntensity={dimmed ? 0 : selected ? 0.5 : hovered ? 0.3 : 0.1}
          roughness={0.15}
          metalness={0.2}
          transmission={0.35}
          thickness={1.2}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(room.w, WALL_H, room.d)]} />
        <lineBasicMaterial
          color={selected ? "#ffffff" : risky ? "#ff6b63" : color}
          transparent
          opacity={dimmed ? 0.1 : 0.9}
        />
      </lineSegments>
      {showLabel && (
        <Html center position={[0, WALL_H / 2 + 0.9, 0]} distanceFactor={26} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-md border border-border bg-background/85 px-2 py-0.5 text-[11px] font-medium text-foreground">
            {room.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/* -------------------------------- walk geometry ------------------------------ */

function Wall({
  position,
  size,
  material,
  onClick,
}: {
  position: [number, number, number];
  size: [number, number, number];
  material: THREE.Material;
  onClick?: () => void;
}) {
  return (
    <mesh position={position} castShadow receiveShadow material={material} onClick={onClick}>
      <boxGeometry args={size} />
    </mesh>
  );
}

function RoomShell({
  room,
  material,
  selected,
  onSelect,
}: {
  room: Room;
  material: THREE.Material;
  selected: boolean;
  onSelect: (room: Room) => void;
}) {
  const base = room.floor * FLOOR_HEIGHT;
  const y = base + WALL_H / 2;
  const t = 0.22;
  const hw = room.w / 2;
  const hd = room.d / 2;
  // rooms on z = -6 open toward +z, rooms on z = 6 open toward -z
  const doorSign = room.z < 0 ? 1 : -1;
  const seg = (room.w - DOOR) / 2;
  const segOffset = DOOR / 2 + seg / 2;
  const click = () => onSelect(room);
  const risky = room.fireRisk === "alert";
  const accent = risky ? "#ff5a52" : ROOM_COLORS[room.type];

  return (
    <group position={[room.x, 0, room.z]}>
      {/* side walls */}
      <Wall position={[-hw, y, 0]} size={[t, WALL_H, room.d]} material={material} onClick={click} />
      <Wall position={[hw, y, 0]} size={[t, WALL_H, room.d]} material={material} onClick={click} />
      {/* back wall */}
      <Wall
        position={[0, y, -doorSign * hd]}
        size={[room.w, WALL_H, t]}
        material={material}
        onClick={click}
      />
      {/* front wall with door gap */}
      <Wall
        position={[-segOffset, y, doorSign * hd]}
        size={[seg, WALL_H, t]}
        material={material}
        onClick={click}
      />
      <Wall
        position={[segOffset, y, doorSign * hd]}
        size={[seg, WALL_H, t]}
        material={material}
        onClick={click}
      />
      {/* lintel above the door */}
      <Wall
        position={[0, base + WALL_H - 0.35, doorSign * hd]}
        size={[DOOR, 0.7, t]}
        material={material}
        onClick={click}
      />
      {/* ceiling */}
      <mesh position={[0, base + WALL_H, 0]} rotation-x={Math.PI / 2} receiveShadow>
        <planeGeometry args={[room.w, room.d]} />
        <meshStandardMaterial color="#111a27" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* ceiling strip light */}
      <mesh position={[0, base + WALL_H - 0.12, 0]}>
        <boxGeometry args={[room.w * 0.55, 0.08, 0.35]} />
        <meshStandardMaterial
          color="#dff7ff"
          emissive={new THREE.Color(risky ? "#ff5a52" : "#bfefff")}
          emissiveIntensity={risky ? 2.4 : 1.6}
        />
      </mesh>
      <pointLight
        position={[0, base + WALL_H - 0.4, 0]}
        intensity={risky ? 10 : 6}
        distance={11}
        color={risky ? "#ff6b63" : "#cfefff"}
      />
      {/* doorway sign */}
      <Html
        center
        position={[0, base + WALL_H + 0.12, doorSign * (hd + 0.25)]}
        distanceFactor={12}
        zIndexRange={[5, 0]}
      >
        <div
          className="pointer-events-none whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            borderColor: accent,
            color: accent,
            background: "rgba(8,14,24,0.8)",
            boxShadow: selected ? `0 0 14px ${accent}` : "none",
          }}
        >
          {room.name}
        </div>
      </Html>
    </group>
  );
}

function WalkInterior({
  activeFloor,
  selectedId,
  onSelect,
  floorTex,
  wallTex,
}: {
  activeFloor: number;
  selectedId: string | null;
  onSelect: (room: Room) => void;
  floorTex: THREE.Texture;
  wallTex: THREE.Texture;
}) {
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wallTex,
        color: "#95a7bd",
        roughness: 0.82,
        metalness: 0.08,
      }),
    [wallTex],
  );
  const rooms = ROOMS.filter((r) => r.floor === activeFloor);
  const base = activeFloor * FLOOR_HEIGHT;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[-2, base + 0.01, 0]} receiveShadow>
        <planeGeometry args={[42, 26]} />
        <meshStandardMaterial map={floorTex} roughness={0.55} metalness={0.25} color="#8fa6bd" />
      </mesh>
      {/* outer shell */}
      {[
        { p: [-2, base + WALL_H / 2, -13] as [number, number, number], s: [42, WALL_H, 0.3] as [number, number, number] },
        { p: [-2, base + WALL_H / 2, 13] as [number, number, number], s: [42, WALL_H, 0.3] as [number, number, number] },
        { p: [-23, base + WALL_H / 2, 0] as [number, number, number], s: [0.3, WALL_H, 26] as [number, number, number] },
        { p: [19, base + WALL_H / 2, 0] as [number, number, number], s: [0.3, WALL_H, 26] as [number, number, number] },
      ].map((w, i) => (
        <Wall key={i} position={w.p} size={w.s} material={wallMat} />
      ))}
      {/* corridor ceiling */}
      <mesh rotation-x={Math.PI / 2} position={[-2, base + WALL_H, 0]}>
        <planeGeometry args={[42, 26]} />
        <meshStandardMaterial color="#0d1623" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {[-14, -6, 2, 10].map((x) => (
        <group key={x}>
          <mesh position={[x, base + WALL_H - 0.1, 0]}>
            <boxGeometry args={[3.2, 0.08, 0.3]} />
            <meshStandardMaterial
              color="#eaffff"
              emissive={new THREE.Color("#7fe7ff")}
              emissiveIntensity={2}
            />
          </mesh>
          <pointLight position={[x, base + WALL_H - 0.5, 0]} intensity={8} distance={14} color="#9fe9ff" />
        </group>
      ))}
      {rooms.map((r) => (
        <RoomShell
          key={r.id}
          room={r}
          material={wallMat}
          selected={r.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

/* ---------------------------------- walk rig --------------------------------- */

function WalkRig({
  controls,
  floor,
  onArrive,
}: {
  controls: React.MutableRefObject<Controls>;
  floor: number;
  onArrive: () => void;
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(Math.PI);
  const pitch = useRef(0);
  const vel = useRef(new THREE.Vector3());
  const bob = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current = {};
    };
  }, []);

  // drag to look around
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const start = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      yaw.current -= (e.clientX - lx) * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (e.clientY - ly) * 0.003, -0.9, 0.9);
      lx = e.clientX;
      ly = e.clientY;
    };
    const end = () => (dragging = false);
    el.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => {
      el.removeEventListener("pointerdown", start);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  }, [gl]);

  useEffect(() => {
    camera.position.set(-2, floor * FLOOR_HEIGHT + EYE, 10);
    yaw.current = Math.PI;
    pitch.current = 0;
    controls.current.target = null;
  }, [floor, camera, controls]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const c = controls.current;
    const k = keys.current;

    let fwd = c.fwd;
    let strafe = c.strafe;
    let turn = c.turn;
    if (k["KeyW"] || k["ArrowUp"]) fwd += 1;
    if (k["KeyS"] || k["ArrowDown"]) fwd -= 1;
    if (k["KeyD"]) strafe += 1;
    if (k["KeyA"]) strafe -= 1;
    if (k["ArrowRight"]) turn -= 1;
    if (k["ArrowLeft"]) turn += 1;
    const running = c.run || k["ShiftLeft"];

    // auto-walk toward a selected destination
    const dest = c.target;
    if (dest) {
      const dx = dest.x - camera.position.x;
      const dz = dest.z - camera.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.6) {
        c.target = null;
        onArrive();
      } else {
        const desired = Math.atan2(-dx, -dz);
        let diff = ((desired - yaw.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        yaw.current += diff * Math.min(1, dt * 4);
        fwd = 1;
        strafe = 0;
      }
    }

    yaw.current += turn * dt * 1.8;

    const speed = (running ? 11 : 5.5) * (dest ? 1.3 : 1);
    const dir = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const side = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const wish = new THREE.Vector3()
      .addScaledVector(dir, fwd)
      .addScaledVector(side, strafe);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);

    vel.current.lerp(wish, 1 - Math.exp(-12 * dt));
    camera.position.addScaledVector(vel.current, dt);

    const moving = vel.current.length() > 0.4;
    bob.current += moving ? dt * (running ? 13 : 9) : 0;
    const bobY = moving ? Math.sin(bob.current) * 0.055 : 0;

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -22.4, 18.4);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -12.4, 12.4);
    camera.position.y = floor * FLOOR_HEIGHT + EYE + bobY;
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch.current, yaw.current, Math.sin(bob.current * 0.5) * 0.008);
  });

  return null;
}

/* ----------------------------------- scene ----------------------------------- */

function Scene({
  activeFloor,
  selectedId,
  onSelect,
  mode,
  controls,
  onArrive,
}: ViewerProps & {
  controls: React.MutableRefObject<Controls>;
  onArrive: () => void;
}) {
  const floorTex = useMemo(() => makeFloorTexture(), []);
  const wallTex = useMemo(() => makeWallTexture(), []);

  return (
    <>
      <color attach="background" args={["#070d17"]} />
      <fog attach="fog" args={["#070d17", mode === "walk" ? 18 : 45, mode === "walk" ? 60 : 120]} />
      <ambientLight intensity={mode === "walk" ? 0.32 : 0.5} />
      <hemisphereLight args={["#7fe7ff", "#0b1220", 0.45]} />
      <directionalLight
        position={[18, 26, 14]}
        intensity={mode === "walk" ? 0.5 : 1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment resolution={128}>
        <Lightformer intensity={1.6} position={[0, 6, 0]} scale={[14, 14, 1]} />
        <Lightformer
          intensity={1.1}
          color="#7fe7ff"
          position={[-8, 2, -2]}
          rotation-y={Math.PI / 2}
          scale={[24, 2, 1]}
        />
        <Lightformer
          intensity={0.8}
          color="#a78bfa"
          position={[8, 2, 2]}
          rotation-y={-Math.PI / 2}
          scale={[24, 2, 1]}
        />
      </Environment>

      {mode === "walk" ? (
        <>
          <WalkInterior
            activeFloor={activeFloor}
            selectedId={selectedId}
            onSelect={onSelect}
            floorTex={floorTex}
            wallTex={wallTex}
          />
          <WalkRig controls={controls} floor={activeFloor} onArrive={onArrive} />
        </>
      ) : (
        <>
          <gridHelper args={[90, 45, "#1f3b52", "#152535"]} position={[0, -0.2, 0]} />
          {FLOORS.map((f) => (
            <mesh
              key={f.level}
              receiveShadow
              rotation-x={-Math.PI / 2}
              position={[-2, f.level * FLOOR_HEIGHT - 0.05, 0]}
            >
              <planeGeometry args={[38, 24]} />
              <meshStandardMaterial
                map={floorTex}
                color="#7f93ab"
                transparent
                opacity={f.level !== activeFloor ? 0.16 : 1}
                roughness={0.6}
                metalness={0.3}
              />
            </mesh>
          ))}
          {ROOMS.map((room) => (
            <RoomBlock
              key={room.id}
              room={room}
              dimmed={room.floor !== activeFloor}
              selected={room.id === selectedId}
              onSelect={onSelect}
              showLabel={room.floor === activeFloor}
            />
          ))}
          <ContactShadows position={[-2, -0.18, 0]} opacity={0.5} scale={70} blur={2.6} far={14} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={10}
            maxDistance={70}
            maxPolarAngle={Math.PI / 2.1}
            target={[-2, activeFloor * FLOOR_HEIGHT + 2, 0]}
          />
        </>
      )}
    </>
  );
}

/* ---------------------------------- overlay ---------------------------------- */

function PadButton({
  controls,
  set,
  children,
  label,
  className = "",
}: {
  controls: React.MutableRefObject<Controls>;
  set: (c: Controls, on: boolean) => void;
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  const on = useCallback(() => set(controls.current, true), [controls, set]);
  const off = useCallback(() => set(controls.current, false), [controls, set]);
  return (
    <button
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        on();
      }}
      onPointerUp={off}
      onPointerLeave={off}
      onPointerCancel={off}
      onBlur={off}
      className={`grid size-11 place-items-center rounded-xl border border-border bg-background/85 text-foreground backdrop-blur transition active:scale-95 active:border-primary active:text-primary ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------------------------- viewer ----------------------------------- */

export default function BuildingViewer(props: ViewerProps) {
  const { activeFloor, mode, onSelect } = props;
  const controls = useRef<Controls>({ fwd: 0, strafe: 0, turn: 0, run: false, target: null });
  const [destination, setDestination] = useState<Room | null>(null);
  const [travelling, setTravelling] = useState(false);

  const floorRooms = useMemo(() => ROOMS.filter((r) => r.floor === activeFloor), [activeFloor]);

  useEffect(() => {
    controls.current.target = null;
    setTravelling(false);
    setDestination(null);
  }, [activeFloor, mode]);

  const goTo = (room: Room) => {
    const doorSign = room.z < 0 ? 1 : -1;
    controls.current.target = { x: room.x, z: room.z + doorSign * (room.d / 2 - 1.4) };
    setDestination(room);
    setTravelling(true);
  };

  const arrive = useCallback(() => {
    setTravelling(false);
    setDestination((d) => {
      if (d) onSelect(d);
      return d;
    });
  }, [onSelect]);

  return (
    <div className="relative size-full">
      <Canvas shadows camera={{ position: [24, 22, 36], fov: 55 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene {...props} controls={controls} onArrive={arrive} />
        </Suspense>
      </Canvas>

      {mode === "walk" && (
        <>
          {/* crosshair */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-primary/70" />
            <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-primary/70" />
            <div className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-primary/70" />
            <div className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-primary/70" />
          </div>

          {/* destination list */}
          <div className="absolute right-3 top-16 w-44 rounded-xl border border-border bg-background/85 p-2 backdrop-blur">
            <p className="mb-1 flex items-center gap-1 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <DoorOpen className="size-3" /> Walk to
            </p>
            <div className="max-h-44 space-y-0.5 overflow-y-auto">
              {floorRooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => goTo(r)}
                  className={`w-full truncate rounded-lg px-2 py-1 text-left text-[11px] transition ${
                    destination?.id === r.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
            {travelling && destination && (
              <p className="mt-1 px-1 text-[10px] text-primary">Walking to {destination.name}…</p>
            )}
          </div>

          {/* movement pad */}
          <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1.5">
            <PadButton controls={controls} label="Walk forward" set={(c, on) => (c.fwd = on ? 1 : 0)}>
              <ArrowUp className="size-4" />
            </PadButton>
            <div className="flex gap-1.5">
              <PadButton
                controls={controls}
                label="Strafe left"
                set={(c, on) => (c.strafe = on ? -1 : 0)}
              >
                <ArrowLeft className="size-4" />
              </PadButton>
              <PadButton
                controls={controls}
                label="Walk back"
                set={(c, on) => (c.fwd = on ? -1 : 0)}
              >
                <ArrowDown className="size-4" />
              </PadButton>
              <PadButton
                controls={controls}
                label="Strafe right"
                set={(c, on) => (c.strafe = on ? 1 : 0)}
              >
                <ArrowRight className="size-4" />
              </PadButton>
            </div>
            <div className="flex gap-1.5">
              <PadButton controls={controls} label="Turn left" set={(c, on) => (c.turn = on ? 1 : 0)}>
                <RotateCcw className="size-4" />
              </PadButton>
              <PadButton controls={controls} label="Run" set={(c, on) => (c.run = on)}>
                <Zap className="size-4" />
              </PadButton>
              <PadButton
                controls={controls}
                label="Turn right"
                set={(c, on) => (c.turn = on ? -1 : 0)}
              >
                <RotateCw className="size-4" />
              </PadButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

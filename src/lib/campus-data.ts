export type RoomType = "classroom" | "lab" | "office" | "corridor" | "utility";
export type FireRisk = "safe" | "watch" | "alert";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  floor: number;
  /** grid position in metres, x/z centre */
  x: number;
  z: number;
  w: number;
  d: number;
  capacity: number;
  occupancy: number;
  temperature: number;
  humidity: number;
  energy: number; // kWh today
  co2: number;
  fireRisk: FireRisk;
}

export const FLOORS = [
  { level: 0, name: "Ground Floor", label: "G" },
  { level: 1, name: "First Floor", label: "1" },
  { level: 2, name: "Second Floor", label: "2" },
];

export const FLOOR_HEIGHT = 4;

const mk = (r: Omit<Room, "id">): Room => ({
  ...r,
  id: `${r.floor}-${r.name.toLowerCase().replace(/\s+/g, "-")}`,
});

function floorRooms(floor: number, names: Array<[string, RoomType, number]>): Room[] {
  // layout: two rows of rooms with a corridor between them
  const rooms: Room[] = [];
  names.forEach(([name, type, cap], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const seed = (floor + 1) * 13 + i * 7;
    const rnd = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 / (1 / n);
    const occ = type === "corridor" ? Math.round(rnd(12)) : Math.round(rnd(cap));
    rooms.push(
      mk({
        name,
        type,
        floor,
        x: -12 + col * 8,
        z: row === 0 ? -6 : 6,
        w: 7,
        d: 7,
        capacity: cap,
        occupancy: Math.min(occ, cap),
        temperature: +(20 + rnd(6)).toFixed(1),
        humidity: Math.round(38 + rnd(20)),
        energy: +(4 + rnd(26)).toFixed(1),
        co2: Math.round(420 + rnd(600)),
        fireRisk: seed % 17 === 0 ? "alert" : seed % 5 === 0 ? "watch" : "safe",
      }),
    );
  });
  return rooms;
}

export const ROOMS: Room[] = [
  ...floorRooms(0, [
    ["Main Lobby", "corridor", 60],
    ["Lecture Hall A", "classroom", 120],
    ["Lecture Hall B", "classroom", 120],
    ["Reception Office", "office", 8],
    ["Robotics Lab", "lab", 30],
    ["Electrical Lab", "lab", 28],
    ["Server Room", "utility", 4],
    ["North Corridor", "corridor", 40],
  ]),
  ...floorRooms(1, [
    ["Classroom 101", "classroom", 45],
    ["Classroom 102", "classroom", 45],
    ["AI Research Lab", "lab", 24],
    ["Networks Lab", "lab", 24],
    ["Faculty Office 1", "office", 6],
    ["Faculty Office 2", "office", 6],
    ["Study Lounge", "corridor", 35],
    ["East Corridor", "corridor", 30],
  ]),
  ...floorRooms(2, [
    ["Classroom 201", "classroom", 40],
    ["Design Studio", "lab", 26],
    ["IoT Lab", "lab", 22],
    ["Dean Office", "office", 5],
    ["Meeting Room", "office", 14],
    ["Archive", "utility", 3],
    ["Roof Plant Room", "utility", 2],
    ["West Corridor", "corridor", 25],
  ]),
];

export const ROOM_COLORS: Record<RoomType, string> = {
  classroom: "#3ba6ff",
  lab: "#22e3c3",
  office: "#a78bfa",
  corridor: "#5b7391",
  utility: "#f59e0b",
};

export const ALERTS = [
  {
    id: "a1",
    severity: "critical" as const,
    title: "Smoke sensor triggered",
    where: "Server Room · Ground Floor",
    time: "2 min ago",
  },
  {
    id: "a2",
    severity: "warning" as const,
    title: "Occupancy above safe capacity",
    where: "Lecture Hall A · Ground Floor",
    time: "11 min ago",
  },
  {
    id: "a3",
    severity: "warning" as const,
    title: "HVAC energy spike +34%",
    where: "AI Research Lab · First Floor",
    time: "26 min ago",
  },
  {
    id: "a4",
    severity: "info" as const,
    title: "Air quality restored to normal",
    where: "Design Studio · Second Floor",
    time: "1 h ago",
  },
];

export const ENERGY_SERIES = [
  { t: "00:00", hvac: 42, lighting: 18, equipment: 25 },
  { t: "03:00", hvac: 35, lighting: 12, equipment: 20 },
  { t: "06:00", hvac: 48, lighting: 26, equipment: 31 },
  { t: "09:00", hvac: 92, lighting: 58, equipment: 64 },
  { t: "12:00", hvac: 118, lighting: 62, equipment: 79 },
  { t: "15:00", hvac: 104, lighting: 55, equipment: 71 },
  { t: "18:00", hvac: 76, lighting: 47, equipment: 52 },
  { t: "21:00", hvac: 54, lighting: 28, equipment: 33 },
];

export const OCCUPANCY_SERIES = [
  { t: "08:00", people: 120 },
  { t: "09:00", people: 264 },
  { t: "10:00", people: 348 },
  { t: "11:00", people: 402 },
  { t: "12:00", people: 366 },
  { t: "13:00", people: 288 },
  { t: "14:00", people: 331 },
  { t: "15:00", people: 245 },
  { t: "16:00", people: 158 },
];

export const CAMPUS_BUILDINGS = [
  { id: "b1", name: "Engineering Block A", x: 46, y: 44, active: true },
  { id: "b2", name: "Library", x: 22, y: 26 },
  { id: "b3", name: "Science Faculty", x: 70, y: 28 },
  { id: "b4", name: "Student Hub", x: 30, y: 70 },
  { id: "b5", name: "Sports Complex", x: 76, y: 68 },
];

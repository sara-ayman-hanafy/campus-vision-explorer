import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ENERGY_SERIES, OCCUPANCY_SERIES, ROOMS, ROOM_COLORS, type RoomType } from "@/lib/campus-data";

const axis = { stroke: "oklch(0.7 0.03 245)", fontSize: 11 };
const tooltipStyle = {
  background: "oklch(0.21 0.03 255)",
  border: "1px solid oklch(0.32 0.035 250)",
  borderRadius: 10,
  fontSize: 12,
  color: "oklch(0.95 0.012 235)",
};

export function EnergyChart() {
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold">Energy consumption · 24 h</h3>
      <p className="mb-3 text-xs text-muted-foreground">kW by subsystem</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ENERGY_SERIES}>
            <defs>
              <linearGradient id="gHvac" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gEquip" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.035 250 / 45%)" />
            <XAxis dataKey="t" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="hvac" stroke="var(--color-chart-1)" fill="url(#gHvac)" />
            <Area
              type="monotone"
              dataKey="lighting"
              stroke="var(--color-chart-2)"
              fill="url(#gLight)"
            />
            <Area
              type="monotone"
              dataKey="equipment"
              stroke="var(--color-chart-3)"
              fill="url(#gEquip)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OccupancyChart() {
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold">Occupancy flow</h3>
      <p className="mb-3 text-xs text-muted-foreground">People inside the building per hour</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={OCCUPANCY_SERIES}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.035 250 / 45%)" />
            <XAxis dataKey="t" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={34} />
            <Tooltip cursor={{ fill: "oklch(0.32 0.035 250 / 25%)" }} contentStyle={tooltipStyle} />
            <Bar dataKey="people" fill="var(--color-chart-1)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SpaceMixChart() {
  const counts = ROOMS.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold">Space distribution</h3>
      <p className="mb-3 text-xs text-muted-foreground">Monitored zones by type</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={ROOM_COLORS[d.name as RoomType]} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, textTransform: "capitalize" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

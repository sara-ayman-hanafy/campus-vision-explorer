import { Flame, Thermometer, Users, Zap, Wind, Droplets } from "lucide-react";
import type { Room } from "@/lib/campus-data";

const riskStyles: Record<Room["fireRisk"], string> = {
  safe: "text-success border-success/40 bg-success/10",
  watch: "text-warning border-warning/40 bg-warning/10",
  alert: "text-destructive border-destructive/50 bg-destructive/10",
};

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function RoomInspector({ room }: { room: Room | null }) {
  if (!room) {
    return (
      <div className="panel flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="grid-fade size-16 rounded-xl border border-border" />
        <p className="text-sm font-medium">No room selected</p>
        <p className="max-w-[16rem] text-xs text-muted-foreground">
          Click any room in the 3D twin to inspect live occupancy, climate, energy and fire-risk
          telemetry.
        </p>
      </div>
    );
  }

  const load = Math.round((room.occupancy / room.capacity) * 100);

  return (
    <div className="panel flex h-full flex-col gap-4 p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{room.name}</h3>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {room.type} · Floor {room.floor === 0 ? "G" : room.floor} · ID {room.id}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${riskStyles[room.fireRisk]}`}
          >
            <Flame className="size-3" />
            {room.fireRisk}
          </span>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Occupancy load</span>
          <span className="tabular-nums">
            {room.occupancy}/{room.capacity}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full ${load > 85 ? "bg-destructive" : load > 60 ? "bg-warning" : "bg-primary"}`}
            style={{ width: `${Math.min(load, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={Users} label="Occupancy" value={`${room.occupancy}`} hint={`${load}% of capacity`} />
        <Metric icon={Thermometer} label="Temperature" value={`${room.temperature}°C`} hint="Setpoint 22°C" />
        <Metric icon={Zap} label="Energy today" value={`${room.energy} kWh`} hint="HVAC + lighting" />
        <Metric icon={Wind} label="CO₂" value={`${room.co2} ppm`} hint={room.co2 > 900 ? "Ventilate" : "Normal"} />
        <Metric icon={Droplets} label="Humidity" value={`${room.humidity}%`} />
        <Metric icon={Flame} label="Smoke index" value={room.fireRisk === "alert" ? "High" : room.fireRisk === "watch" ? "Elevated" : "Low"} />
      </div>

      <div className="mt-auto flex gap-2">
        <button className="glow-ring flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          Control HVAC
        </button>
        <button className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium transition hover:bg-secondary">
          Sensor history
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ROOMS } from "@/lib/campus-data";

export function SensorTable({ floor }: { floor?: number }) {
  const base = floor === undefined ? ROOMS : ROOMS.filter((r) => r.floor === floor);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const jitter = (v: number, i: number, amp: number) =>
    +(v + Math.sin((tick + i) * 1.3) * amp).toFixed(1);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">Real-time sensor stream</h3>
          <p className="text-xs text-muted-foreground">Refreshing every 3 seconds</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-primary">
          <span className="live-dot size-2 rounded-full bg-primary" /> streaming
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Zone</th>
              <th className="px-3 py-3 font-medium">Floor</th>
              <th className="px-3 py-3 font-medium">Temp</th>
              <th className="px-3 py-3 font-medium">CO₂</th>
              <th className="px-3 py-3 font-medium">Occupancy</th>
              <th className="px-3 py-3 font-medium">Energy</th>
              <th className="px-5 py-3 font-medium">Fire</th>
            </tr>
          </thead>
          <tbody>
            {base.map((r, i) => (
              <tr key={r.id} className="border-t border-border/60 hover:bg-secondary/40">
                <td className="px-5 py-2.5 font-medium">{r.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {r.floor === 0 ? "G" : r.floor}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{jitter(r.temperature, i, 0.4)}°C</td>
                <td className="px-3 py-2.5 tabular-nums">{Math.round(jitter(r.co2, i, 14))} ppm</td>
                <td className="px-3 py-2.5 tabular-nums">
                  {r.occupancy}/{r.capacity}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{r.energy} kWh</td>
                <td className="px-5 py-2.5">
                  <span
                    className={`inline-block size-2.5 rounded-full ${
                      r.fireRisk === "alert"
                        ? "bg-destructive live-dot"
                        : r.fireRisk === "watch"
                          ? "bg-warning"
                          : "bg-success"
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

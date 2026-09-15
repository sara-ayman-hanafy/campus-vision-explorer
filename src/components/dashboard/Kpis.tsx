import { Activity, Flame, Users, Zap } from "lucide-react";

const KPIS = [
  {
    label: "Live occupancy",
    value: "412",
    unit: "people",
    delta: "+8.2%",
    positive: true,
    icon: Users,
  },
  { label: "Energy load", value: "268", unit: "kW", delta: "-4.1%", positive: true, icon: Zap },
  {
    label: "Sensors online",
    value: "184/188",
    unit: "nodes",
    delta: "97.9%",
    positive: true,
    icon: Activity,
  },
  { label: "Fire-risk zones", value: "2", unit: "rooms", delta: "+1", positive: false, icon: Flame },
];

export function Kpis() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((k) => (
        <div key={k.label} className="panel relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</span>
            <k.icon className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tabular-nums">{k.value}</span>
            <span className="text-xs text-muted-foreground">{k.unit}</span>
          </div>
          <div
            className={`mt-1 text-xs font-medium ${k.positive ? "text-success" : "text-destructive"}`}
          >
            {k.delta} <span className="text-muted-foreground">vs. yesterday</span>
          </div>
        </div>
      ))}
    </div>
  );
}

import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { ALERTS } from "@/lib/campus-data";

const conf = {
  critical: { icon: ShieldAlert, cls: "text-destructive border-destructive/40 bg-destructive/10" },
  warning: { icon: AlertTriangle, cls: "text-warning border-warning/40 bg-warning/10" },
  info: { icon: Info, cls: "text-primary border-primary/40 bg-primary/10" },
};

export function AlertsPanel({ compact = false }: { compact?: boolean }) {
  const items = compact ? ALERTS.slice(0, 3) : ALERTS;
  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Active alerts</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="live-dot size-2 rounded-full bg-destructive" /> live
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((a) => {
          const c = conf[a.severity];
          return (
            <li
              key={a.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition hover:brightness-125 ${c.cls}`}
            >
              <c.icon className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.where} · {a.time}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

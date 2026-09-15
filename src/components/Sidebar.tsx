import { Boxes, Building2, Gauge, Map, Radio, Siren, X } from "lucide-react";

export type ViewKey = "overview" | "twin" | "gis" | "sensors" | "alerts";

const NAV: Array<{ key: ViewKey; label: string; icon: typeof Gauge }> = [
  { key: "overview", label: "Overview", icon: Gauge },
  { key: "twin", label: "3D Digital Twin", icon: Boxes },
  { key: "gis", label: "Campus GIS", icon: Map },
  { key: "sensors", label: "Sensors", icon: Radio },
  { key: "alerts", label: "Alerts", icon: Siren },
];

export function Sidebar({
  view,
  onChange,
  open,
  onClose,
}: {
  view: ViewKey;
  onChange: (v: ViewKey) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="glow-ring grid size-9 place-items-center rounded-lg bg-primary/15">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Smart Campus</p>
            <p className="truncate text-[11px] text-muted-foreground">Digital Twin Platform</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = item.key === view;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onChange(item.key);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border border-sidebar-border bg-secondary/40 p-3">
          <p className="text-xs font-medium">Building health</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[87%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">87% · 2 zones need attention</p>
        </div>
      </aside>
    </>
  );
}

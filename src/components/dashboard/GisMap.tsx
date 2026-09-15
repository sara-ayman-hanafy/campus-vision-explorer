import { MapPin, Navigation } from "lucide-react";
import { CAMPUS_BUILDINGS } from "@/lib/campus-data";

export function GisMap({ full = false }: { full?: boolean }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">Campus GIS · Engineering Block A</h3>
          <p className="text-xs text-muted-foreground">Lat 30.0626° N · Lon 31.2497° E</p>
        </div>
        <Navigation className="size-4 text-primary" />
      </div>
      <div className={`grid-fade relative w-full ${full ? "h-[60vh]" : "h-72"} bg-secondary/30`}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" preserveAspectRatio="none">
          <path
            d="M0 52 L100 46"
            stroke="oklch(0.32 0.035 250)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M40 0 L46 100"
            stroke="oklch(0.32 0.035 250)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="60" cy="80" r="11" fill="oklch(0.78 0.16 160 / 12%)" />
          <circle cx="14" cy="80" r="9" fill="oklch(0.78 0.16 160 / 12%)" />
        </svg>

        {CAMPUS_BUILDINGS.map((b) => (
          <div
            key={b.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium backdrop-blur ${
                b.active
                  ? "glow-ring border-primary/60 bg-primary/20 text-foreground"
                  : "border-border bg-background/70 text-muted-foreground"
              }`}
            >
              <MapPin className={`size-3 ${b.active ? "text-primary" : ""}`} />
              {b.name}
            </div>
            {b.active && (
              <span className="live-dot absolute -right-1 -top-1 size-2.5 rounded-full bg-primary" />
            )}
          </div>
        ))}

        <div className="absolute bottom-3 left-3 rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
          Scale 1 : 2500 · Campus layer v3
        </div>
      </div>
    </div>
  );
}

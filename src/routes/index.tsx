import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Menu, Layers, Move3d, Footprints, Search, Bell } from "lucide-react";
import { Sidebar, type ViewKey } from "@/components/Sidebar";
import { Kpis } from "@/components/dashboard/Kpis";
import { EnergyChart, OccupancyChart, SpaceMixChart } from "@/components/dashboard/Charts";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { SensorTable } from "@/components/dashboard/SensorTable";
import { GisMap } from "@/components/dashboard/GisMap";
import { RoomInspector } from "@/components/dashboard/RoomInspector";
import { FLOORS, type Room } from "@/lib/campus-data";

const BuildingViewer = lazy(() => import("@/components/twin/BuildingViewer"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Smart Campus Digital Twin | Engineering Block A" },
      {
        name: "description",
        content:
          "Interactive 3D digital twin dashboard for a university building: floor navigation, room telemetry, occupancy, energy, fire risk, GIS and live sensors.",
      },
      { property: "og:title", content: "Smart Campus Digital Twin Dashboard" },
      {
        property: "og:description",
        content:
          "Navigate a university building in 3D and monitor occupancy, energy, climate and fire-risk telemetry in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TITLES: Record<ViewKey, { title: string; sub: string }> = {
  overview: { title: "Building Overview", sub: "Engineering Block A · live operations summary" },
  twin: { title: "3D Digital Twin", sub: "Navigate floors, rooms, labs and corridors" },
  gis: { title: "Campus GIS", sub: "Geospatial context and building location" },
  sensors: { title: "Sensor Network", sub: "188 IoT nodes across 24 monitored zones" },
  alerts: { title: "Alerts & Safety", sub: "Fire risk, occupancy and system anomalies" },
};

function Index() {
  const [view, setView] = useState<ViewKey>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [floor, setFloor] = useState(0);
  const [mode, setMode] = useState<"orbit" | "walk">("orbit");
  const [room, setRoom] = useState<Room | null>(null);

  return (
    <div className="flex min-h-screen">
      <Sidebar view={view} onChange={setView} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{TITLES[view].title}</h1>
            <p className="truncate text-xs text-muted-foreground">{TITLES[view].sub}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground md:flex">
              <Search className="size-3.5" />
              <span className="text-xs">Search room or sensor…</span>
            </div>
            <button className="relative rounded-lg border border-border bg-secondary/40 p-2" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="live-dot absolute right-1 top-1 size-1.5 rounded-full bg-destructive" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 p-4 lg:p-8">
          {view === "overview" && (
            <>
              <Kpis />
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <EnergyChart />
                </div>
                <AlertsPanel compact />
                <OccupancyChart />
                <SpaceMixChart />
                <GisMap />
              </div>
              <SensorTable floor={0} />
            </>
          )}

          {view === "twin" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
              <div className="panel relative h-[62vh] min-h-[420px] overflow-hidden">
                <Suspense
                  fallback={
                    <div className="grid h-full place-items-center text-sm text-muted-foreground">
                      Loading 3D twin…
                    </div>
                  }
                >
                  <BuildingViewer
                    activeFloor={floor}
                    selectedId={room?.id ?? null}
                    onSelect={setRoom}
                    mode={mode}
                  />
                </Suspense>

                <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
                  <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1 backdrop-blur">
                    <span className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <Layers className="mr-1 inline size-3" />
                      Floor
                    </span>
                    {FLOORS.map((f) => (
                      <button
                        key={f.level}
                        onClick={() => setFloor(f.level)}
                        className={`size-8 rounded-lg text-sm font-medium transition ${
                          floor === f.level
                            ? "glow-ring bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1 backdrop-blur">
                    <button
                      onClick={() => setMode("orbit")}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        mode === "orbit" ? "bg-secondary text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Move3d className="size-3.5" /> Orbit
                    </button>
                    <button
                      onClick={() => setMode("walk")}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        mode === "walk" ? "bg-secondary text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Footprints className="size-3.5" /> Walk
                    </button>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border bg-background/80 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur">
                  {mode === "orbit"
                    ? "Drag to rotate · scroll to zoom · click a room to inspect"
                    : "Drag to look · on-screen pad to move · pick a room in “Walk to” and it walks you there"}
                </div>
              </div>

              <div className="space-y-5">
                <RoomInspector room={room} />
              </div>
            </div>
          )}

          {view === "gis" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
              <GisMap full />
              <AlertsPanel compact />
            </div>
          )}

          {view === "sensors" && (
            <>
              <Kpis />
              <SensorTable />
            </>
          )}

          {view === "alerts" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
              <div className="space-y-5">
                <AlertsPanel />
                <SensorTable floor={2} />
              </div>
              <RoomInspector room={room} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

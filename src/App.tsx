import { SessionBlocked } from "./sessionContext";
import { useTheme } from "./theme";
import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Sun,
  Moon,
  Settings,
  Compass,
  Route,
  Landmark,
  Utensils,
  Sparkles,
  FolderOpen,
  SlidersHorizontal,
  Heart,
  Check,
  Clock,
  Search,
  X,
  Download,
  Pencil,
  Trash2,
  ShieldCheck,
  Info,
  ExternalLink,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Circle,
  Plane,
  Hotel,
  Ticket,
  Leaf,
  Music,
  Scale,
  LogOut,
} from "lucide-react";
import { Button, Dialog, Empty, Toast, SelectField } from "./components/ui";
import {
  ResearchPanel,
  ConnectionStatus,
  useConnections,
  ResearchEvidence,
} from "./components/Research";
import { PhotoPending } from "./components/PhotoPending";
import { ResearchFoods } from "./components/ResearchFoods";
import { useResearchLibrary } from "./useResearchLibrary";
import {
  researchVisits,
  resolvedResearch,
  saveResearchItem,
  removeResearchItem,
} from "./researchLibrary";
import {
  providers,
  type ResearchJob,
  type ResearchSelection,
} from "./research";
import { TripEditor } from "./components/TripEditor";
import { CoastArt, JourneyArt, VisitArt } from "./components/Artwork";
import { FoodPhoto } from "./components/FoodPhoto";
import { Logo } from "./components/Logo";
import { useNotebook } from "./useNotebook";
import { api } from "./api";
import {
  initialTrip,
  visits,
  foods,
  money,
  dateLabel,
  dateRange,
  budgetAllocation,
  groupBudget,
  toggle,
  type Trip,
  type Page,
  type Visit,
} from "./domain";
const nav = [
  { id: "viajes", label: "Mis viajes", icon: FolderOpen },
  { id: "preparar", label: "Preparar viaje", icon: Compass },
  { id: "comparar", label: "Comparar", icon: Scale },
  { id: "itinerario", label: "Mi itinerario", icon: Route },
  { id: "cultura", label: "Visitas y cultura", icon: Landmark },
  { id: "sabores", label: "Qué probar", icon: Utensils },
] as const;
const pages: Page[] = [
  "viajes",
  "preparar",
  "comparar",
  "itinerario",
  "cultura",
  "sabores",
  "ajustes",
];
const currentPage = (): Page =>
  pages.includes(location.hash.slice(1) as Page)
    ? (location.hash.slice(1) as Page)
    : "viajes";
export default function App({
  username,
  onExpired,
  onLogout,
}: {
  username: string;
  onExpired: () => void;
  onLogout: () => void;
}) {
  const blocked = useContext(SessionBlocked);
  const notebook = useNotebook(onExpired);
  const connections = useConnections(onExpired);
  const { trips, active, provider } = notebook.data;
  const setTrips = (next: Trip[] | ((current: Trip[]) => Trip[])) =>
    notebook.change((data) => {
      const trips = typeof next === "function" ? next(data.trips) : next;
      return {
        ...data,
        trips,
        active: trips.some((t) => t.id === data.active)
          ? data.active
          : (trips[0]?.id ?? ""),
      };
    });
  const setActive = (active: string) =>
    notebook.change((data) => ({ ...data, active }));
  const setProvider = (provider: string) =>
    notebook.change((data) => ({ ...data, provider }));
  const [page, setPage] = useState<Page>(currentPage);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const exportNotebook = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { format: "itinera-notebook-v1", data: notebook.data },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "itinera-cambios-pendientes.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const logout = async (withoutSaving = false) => {
    if (logoutBusy || mutationBusy) return;
    setLogoutBusy(true);
    setLogoutError("");
    try {
      if (!withoutSaving) {
        try {
          await notebook.flush();
        } catch {
          setLogoutConfirm(true);
          return;
        }
      }
      await api("/api/auth/sign-out", { method: "POST", body: "{}" });
      const channel = new BroadcastChannel("itinera-session");
      channel.postMessage("logout");
      channel.close();
      onLogout();
    } catch (e) {
      setLogoutError(
        `No se ha podido confirmar el cierre de sesión. Vuelve a intentarlo antes de dejar este navegador. ${(e as Error).message}`,
      );
    } finally {
      setLogoutBusy(false);
    }
  };
  const [reloadConfirm, setReloadConfirm] = useState(false);
  const trip = trips.find((t) => t.id === active) ?? trips[0];
  const library = useResearchLibrary(trip, onExpired);
  const { theme, setTheme } = useTheme();
  const [editor, setEditor] = useState<Trip | "new" | null>(null);
  const [deleting, setDeleting] = useState<Trip | null>(null);
  const [detail, setDetail] = useState<Visit | null>(null);
  const [toast, setToast] = useState("");
  const dirty = notebook.dirty;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todo");
  const [town, setTown] = useState("Todas");
  const [day, setDay] = useState("");
  const [foodTab, setFoodTab] = useState("Todos");
  const [coverage, setCoverage] = useState(false);
  const notify = (s: string) => setToast(s);
  const closeToast = useCallback(() => setToast(""), []);
  const go = (p: Page) => {
    if (page === p) return;
    location.hash = p;
  };
  useEffect(() => {
    const change = () => {
      setPage(currentPage());
      window.scrollTo(0, 0);
      requestAnimationFrame(() =>
        document.getElementById("page-title")?.focus(),
      );
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (blocked) return;
    document.title = `${page === "ajustes" ? "Ajustes" : nav.find((n) => n.id === page)?.label} · Itinera`;
  }, [page, blocked]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || editor) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, editor]);
  const update = (next: Trip) => {
    setTrips((t) => t.map((x) => (x.id === next.id ? next : x)));
  };
  const saveProposal = async (job: ResearchJob, ref: ResearchSelection) => {
    setMutationBusy(true);
    try {
      await notebook.commit((data) => ({
        ...data,
        trips: data.trips.map((t) =>
          t.id === job.tripId ? saveResearchItem(t, job, ref) : t,
        ),
      }));
      notify(
        ref.kind === "foods"
          ? "Plato guardado en Qué probar."
          : "Visita guardada en Visitas y cultura. Puedes añadirla al itinerario.",
      );
    } finally {
      setMutationBusy(false);
    }
  };
  const selectVisit = (id: string) => {
    if (!trip) return;
    const selected = trip.selected.includes(id);
    const days = { ...trip.days };
    if (selected) delete days[id];
    else days[id] ??= trip.start;
    update({ ...trip, selected: toggle(trip.selected, id), days });
    notify(
      selected
        ? "Visita retirada del itinerario."
        : "Visita añadida al itinerario provisional.",
    );
  };
  const exportTrip = () => {
    if (!trip) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "itinera-trip-v3",
            notice:
              "Borrador de viaje. budgetPerPerson está expresado en céntimos de euro por persona. Sin comprobaciones específicas de precios, horarios ni disponibilidad. La investigación se conserva por separado en el servidor.",
            trip,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itinera-${trip.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Exportación preparada. Guarda el archivo en un lugar privado.");
  };
  const days = trip ? dateRange(trip.start, trip.end) : [];
  const allocations = useMemo(
    () => (trip ? budgetAllocation(trip.budgetPerPerson) : []),
    [trip?.budgetPerPerson],
  );
  const selectedDay = days.includes(day) ? day : (trip?.start ?? "");
  const isExample =
    trip?.id === initialTrip.id &&
    trip?.destination === initialTrip.destination;
  const availableVisits = useMemo(
    () => [...(isExample ? visits : []), ...researchVisits(trip, library.jobs)],
    [isExample, trip, library.jobs],
  );
  const savedFoods = resolvedResearch(trip, library.jobs).filter(
    (x) => x.ref.kind === "foods",
  );
  const selectedVisits = useMemo(
    () => availableVisits.filter((v) => trip?.selected.includes(v.id)),
    [availableVisits, trip?.selected],
  );
  const filteredVisits = useMemo(() => {
    const normalize = (value: string) =>
      value
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
    const normalizedQuery = normalize(query);
    return availableVisits.filter(
      (v) =>
        (category === "Todo" || v.category === category) &&
        (town === "Todas" || v.town === town) &&
        normalize(`${v.title} ${v.town}`).includes(normalizedQuery),
    );
  }, [availableVisits, category, town, query]);
  const heading = (
    eyebrow: string,
    title: string,
    description: string,
    action?: React.ReactNode,
  ) => (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="page-title" tabIndex={-1}>
          {title}
        </h1>
        <p className="subtitle">{description}</p>
      </div>
      {action}
    </div>
  );
  const visitCard = (v: Visit) => (
    <article className="visit-card" key={v.id}>
      <div className="visit-picture">
        {v.research ? <PhotoPending /> : <VisitArt kind={v.art} />}
        <button
          className={`heart ${trip?.interested.includes(v.id) ? "selected" : ""}`}
          aria-label={`${trip?.interested.includes(v.id) ? "Quitar de" : "Marcar como"} interés: ${v.title}`}
          aria-pressed={trip?.interested.includes(v.id)}
          onClick={() => {
            if (trip)
              update({ ...trip, interested: toggle(trip.interested, v.id) });
          }}
        >
          <Heart size={18} />
        </button>
        {!v.research && <span className="art-label">Ilustración</span>}
      </div>
      <div className="visit-content">
        <div className="card-meta">
          <span>{v.category}</span>
          <span>
            <MapPin size={12} />
            {v.town}
          </span>
        </div>
        <h3>
          <button className="text-title" onClick={() => setDetail(v)}>
            {v.title}
          </button>
        </h3>
        <p>{v.priority}</p>
        <div className="visit-duration">
          <Clock size={14} />
          {v.duration}
        </div>
        <div className="card-bottom">
          <span className="status">
            <span />
            {v.research ? "Por comprobar" : "Sin consultar"}
          </span>
          <button
            className={`small-action ${trip?.selected.includes(v.id) ? "is-added" : ""}`}
            onClick={() => selectVisit(v.id)}
            aria-label={`${trip?.selected.includes(v.id) ? "Quitar" : "Añadir"} ${v.title} ${trip?.selected.includes(v.id) ? "del" : "al"} itinerario`}
          >
            {trip?.selected.includes(v.id) ? (
              <Check size={16} />
            ) : (
              <Plus size={16} />
            )}
            <span>{trip?.selected.includes(v.id) ? "Añadido" : "Añadir"}</span>
          </button>
        </div>
        {v.research && trip && <ResearchEvidence {...v.research} trip={trip} />}
        {v.research && trip && (
          <Button
            variant="ghost"
            onClick={() => update(removeResearchItem(trip, v.id))}
          >
            Retirar ficha guardada
          </Button>
        )}
      </div>
    </article>
  );
  if (!notebook.ready)
    return (
      <main className="connection-screen">
        <Logo />
        <h1>
          {notebook.error
            ? "Tu cuaderno está esperando."
            : "Abriendo tus viajes…"}
        </h1>
        <p role={notebook.error ? "alert" : "status"}>
          {notebook.error || "Cargando el cuaderno guardado."}
        </p>
        {notebook.error && (
          <Button onClick={notebook.retry}>Volver a intentar</Button>
        )}
        {logoutError && <p role="alert">{logoutError}</p>}
        <Button disabled={logoutBusy} onClick={() => void logout(true)}>
          {logoutBusy ? "Saliendo…" : "Cerrar sesión"}
        </Button>
      </main>
    );
  return (
    <div className="app">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("page-title")?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <a
          href="#viajes"
          className="brand-link"
          aria-label="Itinera, mis viajes"
        >
          <Logo />
        </a>
        <p className="brand-caption">VIAJA A TU MANERA</p>
        <nav aria-label="Navegación principal">
          <span className="nav-label">TU CUADERNO</span>
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              aria-current={page === n.id ? "page" : undefined}
              className={page === n.id ? "nav-active" : ""}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "cultura" && trip && (
                <span className="nav-count">{selectedVisits.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="personal-note">
            <span className="little-arch">↗</span>
            <p>
              El viaje también está
              <br />
              en lo que descubres.
            </p>
          </div>
          <a
            href="#ajustes"
            className={`settings-link ${page === "ajustes" ? "nav-active" : ""}`}
            aria-current={page === "ajustes" ? "page" : undefined}
          >
            <Settings size={19} />
            Ajustes
            <span className="status-dot" />
          </a>
          <div className="profile">
            <span className="avatar">T</span>
            <div>
              <strong>Tu espacio personal</strong>
              <small>Sesión de {username}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Tu cuaderno</span>
            <ChevronRight size={14} />
            <strong>
              {page === "ajustes"
                ? "Ajustes"
                : nav.find((n) => n.id === page)?.label}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-pill">
              <span />
              Acceso privado
            </span>
            <Button
              variant="ghost"
              disabled={logoutBusy || mutationBusy}
              onClick={() => void logout()}
            >
              <LogOut size={17} />
              {logoutBusy ? "Saliendo…" : "Cerrar sesión"}
            </Button>
            <button
              className="theme-toggle"
              aria-label={`Activar modo ${theme === "light" ? "oscuro" : "claro"}`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
          </div>
        </header>
        <main id="main" inert={mutationBusy || logoutBusy}>
          {!!trip?.researchSelections?.length &&
            ["cultura", "sabores", "itinerario"].includes(page) &&
            (library.loading ? (
              <p role="status">Abriendo las fichas y fuentes guardadas…</p>
            ) : library.error ? (
              <div className="notice" role="alert">
                {library.error}
                <Button onClick={() => void library.retry()}>
                  Volver a cargar fuentes
                </Button>
              </div>
            ) : null)}
          {logoutError && (
            <p className="notice" role="alert">
              {logoutError}
            </p>
          )}
          <div
            className="save-status"
            role={
              ["error", "conflict", "expired"].includes(notebook.state)
                ? "alert"
                : "status"
            }
          >
            {notebook.state === "saved"
              ? "Guardado en el servidor"
              : notebook.state === "saving"
                ? "Guardando…"
                : notebook.state === "pending"
                  ? "Cambios pendientes de guardar"
                  : notebook.error}
            {["error", "expired"].includes(notebook.state) && (
              <Button onClick={notebook.retry}>Volver a intentar</Button>
            )}
            {notebook.state === "conflict" && (
              <>
                <Button
                  onClick={() => {
                    const blob = new Blob(
                      [
                        JSON.stringify(
                          {
                            format: "itinera-notebook-v1",
                            data: notebook.data,
                          },
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    );
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "itinera-cambios-pendientes.json";
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Exportar mis cambios
                </Button>
                <Button onClick={() => setReloadConfirm(true)}>
                  Cargar versión guardada
                </Button>
              </>
            )}
          </div>
          <div className="demo-notice">
            <Info size={15} />
            <span>
              Puedes investigar tu viaje en Preparar viaje. Precios, horarios y
              disponibilidad requieren comprobación específica.
            </span>
            <a href="#ajustes">
              Qué está conectado
              <ArrowUpRight size={13} />
            </a>
          </div>
          {page === "viajes" && (
            <>
              {heading(
                "MENOS PRISAS. MÁS DESCUBRIMIENTOS.",
                "Tu próximo capítulo.",
                "Un lugar para imaginar, preparar y vivir tus viajes.",
                <Button variant="primary" onClick={() => setEditor("new")}>
                  <Plus size={18} />
                  Nuevo viaje
                </Button>,
              )}
              {trip ? (
                <>
                  <section className="destination-hero">
                    {isExample ? <CoastArt /> : <JourneyArt />}
                    <div className="hero-shade" />
                    <div className="hero-content">
                      <span className="hero-tag">
                        <span />{" "}
                        {isExample
                          ? "VIAJE FICTICIO · BORRADOR"
                          : "TU BORRADOR"}
                      </span>
                      <p className="hero-kicker">
                        {isExample
                          ? "Entre historia y el Adriático"
                          : "Un nuevo lugar por descubrir"}
                      </p>
                      <h2>{trip.destination}</h2>
                      <p>
                        {isExample
                          ? "Arte, huellas de Roma y una costa para perder la noción del tiempo."
                          : "Tu viaje empieza con una idea. Dale forma, día a día."}
                      </p>
                      <Button onClick={() => go("itinerario")}>
                        Continuar mi viaje
                        <ArrowRight size={18} />
                      </Button>
                    </div>
                    <span className="hero-caption">
                      {isExample
                        ? "PUGLIA, REIMAGINADA"
                        : "PAISAJE DE INSPIRACIÓN"}{" "}
                      · ILUSTRACIÓN
                    </span>
                  </section>
                  <div className="trip-summary">
                    <div>
                      <CalendarDays />
                      <span>
                        FECHAS
                        <strong>
                          {dateLabel(trip.start)} —{" "}
                          {dateLabel(trip.end, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </div>
                    <div>
                      <Users />
                      <span>
                        COMPAÑÍA<strong>{trip.travelers} viajeros</strong>
                      </span>
                    </div>
                    <div>
                      <Wallet />
                      <span>
                        PRESUPUESTO / PERSONA
                        <strong>
                          {money(trip.budgetPerPerson)} <small>previstos</small>
                        </strong>
                      </span>
                    </div>
                    <div>
                      <Leaf />
                      <span>
                        EL RITMO<strong>{trip.pace}</strong>
                      </span>
                    </div>
                    <button
                      aria-label="Editar viaje"
                      onClick={() => setEditor(trip)}
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                  <div className="dashboard-grid">
                    <section>
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">LO QUE TE MUEVE</p>
                          <h2>La cultura, en el centro.</h2>
                        </div>
                        <a href="#cultura">
                          Explorar visitas
                          <ArrowRight size={16} />
                        </a>
                      </div>
                      {availableVisits.length ? (
                        <div className="card-grid two">
                          {availableVisits.slice(0, 2).map(visitCard)}
                        </div>
                      ) : (
                        <Empty title="Un destino por investigar">
                          Las visitas aparecerán aquí cuando conectemos la
                          investigación.
                        </Empty>
                      )}
                    </section>
                    <aside className="next-panel">
                      <span className="panel-symbol">
                        <Compass size={24} />
                      </span>
                      <p className="eyebrow">PASO A PASO</p>
                      <h2>
                        Todo empieza
                        <br />
                        con una buena idea.
                      </h2>
                      <p>
                        Ya tienes destino. Ahora toca dar espacio a lo que más
                        te interesa.
                      </p>
                      <ol>
                        <li>
                          <CheckCircle2 size={18} />
                          <span>
                            Definir fechas y presupuesto
                            <small>La base de tu viaje</small>
                          </span>
                        </li>
                        <li>
                          <Circle size={18} />
                          <span>
                            Elegir las visitas
                            <small>Museos, Roma y mucho más</small>
                          </span>
                        </li>
                        <li>
                          <Circle size={18} />
                          <span>
                            Comprobar las fuentes
                            <small>Consulta desde Preparar viaje</small>
                          </span>
                        </li>
                      </ol>
                      <Button onClick={() => go("preparar")}>
                        Preparar los detalles
                        <ArrowRight size={16} />
                      </Button>
                    </aside>
                  </div>
                </>
              ) : (
                <Empty
                  title="Tu cuaderno está por estrenar"
                  action={
                    <Button variant="primary" onClick={() => setEditor("new")}>
                      <Plus size={18} />
                      Crear mi primer viaje
                    </Button>
                  }
                >
                  Empieza por un destino, unas fechas y un presupuesto.
                </Empty>
              )}
              <section className="saved-section">
                <div className="section-heading">
                  <h2>
                    En tu cuaderno <span className="count">{trips.length}</span>
                  </h2>
                  <span className="muted">Tus viajes guardados</span>
                </div>
                <div className="saved-list">
                  {trips.map((t) => (
                    <article
                      className={`saved-trip ${t.id === trip?.id ? "active-trip" : ""}`}
                      key={t.id}
                    >
                      <div className="trip-stamp">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h3>{t.destination}</h3>
                        <p>
                          {dateLabel(t.start)} — {dateLabel(t.end)} ·{" "}
                          {t.travelers} viajeros
                        </p>
                      </div>
                      <span className="badge">
                        {t.demo ? "Ejemplo" : "Borrador"}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActive(t.id);
                          setDay("");
                          go("itinerario");
                        }}
                        aria-label={`Abrir viaje a ${t.destination}`}
                      >
                        <ArrowRight size={19} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setDeleting(t)}
                        aria-label={`Eliminar viaje a ${t.destination}`}
                      >
                        <Trash2 size={17} />
                      </Button>
                    </article>
                  ))}
                  <button
                    className="new-trip-card"
                    onClick={() => setEditor("new")}
                  >
                    <Plus size={24} />
                    <span>Otra idea, otro destino</span>
                  </button>
                </div>
              </section>
            </>
          )}
          {page === "preparar" && (
            <>
              {heading(
                "LA BASE DEL VIAJE",
                "Dale forma a la idea.",
                "Lo importante es cómo te gustaría vivirlo.",
              )}
              <div className="split-layout">
                <section className="panel">
                  <span className="panel-symbol">
                    <Compass />
                  </span>
                  <h2>
                    {trip ? "Tu punto de partida" : "Un cuaderno en blanco"}
                  </h2>
                  {trip ? (
                    <>
                      <dl className="detail-list">
                        <div>
                          <dt>Destino</dt>
                          <dd>{trip.destination}</dd>
                        </div>
                        <div>
                          <dt>Desde</dt>
                          <dd>{trip.origin}</dd>
                        </div>
                        <div>
                          <dt>Fechas</dt>
                          <dd>
                            {dateLabel(trip.start)} — {dateLabel(trip.end)}
                          </dd>
                        </div>
                        <div>
                          <dt>Viajeros</dt>
                          <dd>{trip.travelers}</dd>
                        </div>
                        <div>
                          <dt>Presupuesto por persona</dt>
                          <dd>{money(trip.budgetPerPerson)}</dd>
                        </div>
                        <div>
                          <dt>Total para {trip.travelers} viajeros</dt>
                          <dd>{money(groupBudget(trip))}</dd>
                        </div>
                        <div>
                          <dt>Ritmo</dt>
                          <dd>{trip.pace}</dd>
                        </div>
                      </dl>
                      {trip.notes && <blockquote>{trip.notes}</blockquote>}
                      <Button variant="primary" onClick={() => setEditor(trip)}>
                        <Pencil size={17} />
                        Editar los detalles
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" onClick={() => setEditor("new")}>
                      Crear un viaje
                      <Plus size={17} />
                    </Button>
                  )}
                </section>
                {trip ? (
                  <ResearchPanel
                    key={trip.id}
                    trip={trip}
                    provider={provider}
                    connections={connections.data}
                    beforeStart={notebook.flush}
                    onSave={saveProposal}
                    onExpired={onExpired}
                    onChanged={() => void connections.refresh()}
                  />
                ) : (
                  <section className="panel">
                    <h2>Tu asistente de viaje</h2>
                    <p>
                      Crea un viaje para investigar sus museos, agendas y
                      gastronomía.
                    </p>
                  </section>
                )}
              </div>
            </>
          )}
          {page === "comparar" && (
            <>
              {heading(
                "DECIDIR CON PERSPECTIVA",
                "Cada viaje tiene sus opciones.",
                "Compara el coste completo, las condiciones y el tiempo que ganas.",
              )}
              <div className="panel">
                <Empty
                  title="Todavía no hay ofertas consultadas"
                  action={
                    <Button onClick={() => go("ajustes")}>
                      Ver conexiones
                      <ArrowRight size={17} />
                    </Button>
                  }
                >
                  Aquí podrás comparar hasta tres alternativas de transporte y
                  alojamiento para las mismas fechas y viajeros. Ningún importe
                  de ejemplo se presenta como una oferta.
                </Empty>
              </div>
              {trip && (
                <section className="panel budget-panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">UNA REFERENCIA PARA EMPEZAR</p>
                      <h2>
                        Cómo podrías repartir {money(trip.budgetPerPerson)} por
                        persona
                      </h2>
                    </div>
                    <span className="badge">Simulación de reparto</span>
                  </div>
                  <div className="budget-bar" aria-hidden="true">
                    {[25, 40, 20, 10, 5].map((v, i) => (
                      <span key={i} style={{ flex: v }} />
                    ))}
                  </div>
                  <div className="budget-items">
                    {[
                      "Transporte",
                      "Alojamiento",
                      "Comidas libres",
                      "Cultura",
                      "Margen",
                    ].map((label, i) => (
                      <div key={label}>
                        <span className={`budget-dot budget-${i}`} />
                        <span>
                          {label}
                          <strong>{money(allocations[i])}</strong>
                        </span>
                        <small>{[25, 40, 20, 10, 5][i]} %</small>
                      </div>
                    ))}
                  </div>
                  <p className="muted">
                    Reparto ilustrativo por persona. Para {trip.travelers}{" "}
                    viajeros, el límite conjunto sería{" "}
                    {money(groupBudget(trip))}. No es una estimación de precios
                    del destino; las comidas quedan a tu elección.
                  </p>
                </section>
              )}
            </>
          )}
          {page === "itinerario" && (
            <>
              {heading(
                "UN VIAJE A TU RITMO",
                trip ? trip.destination : "Tu itinerario, día a día.",
                "Un plan abierto a los pequeños descubrimientos.",
                trip && (
                  <div className="heading-actions">
                    <Button onClick={() => setEditor(trip)}>
                      <Pencil size={16} />
                      Editar viaje
                    </Button>
                    <Button onClick={exportTrip}>
                      <Download size={16} />
                      Exportar
                    </Button>
                  </div>
                ),
              )}
              {!trip ? (
                <Empty
                  title="Primero, elige un destino"
                  action={
                    <Button onClick={() => setEditor("new")}>
                      Crear viaje
                    </Button>
                  }
                >
                  Necesitamos unas fechas para construir el itinerario.
                </Empty>
              ) : (
                <>
                  <div className="itinerary-meta">
                    <span>
                      <CalendarDays size={16} />
                      {dateLabel(trip.start)} — {dateLabel(trip.end)}
                    </span>
                    <span>
                      <Users size={16} />
                      {trip.travelers} viajeros
                    </span>
                    <span className="status">
                      <span />
                      Itinerario provisional
                    </span>
                  </div>
                  <div
                    className="days"
                    role="group"
                    aria-label="Elegir día del itinerario"
                  >
                    {days.map((d, i) => (
                      <button
                        key={d}
                        aria-pressed={selectedDay === d}
                        className={selectedDay === d ? "selected" : ""}
                        onClick={() => setDay(d)}
                      >
                        <span>DÍA {i + 1}</span>
                        <strong>{dateLabel(d)}</strong>
                        <small>{dateLabel(d, { weekday: "short" })}</small>
                      </button>
                    ))}
                  </div>
                  <div className="itinerary-grid">
                    <section>
                      <div className="section-heading">
                        <h2>
                          {dateLabel(selectedDay, {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h2>
                        <a href="#cultura">
                          <Plus size={16} />
                          Añadir visita
                        </a>
                      </div>
                      <div className="notice compact">
                        <Info size={16} />
                        Orden orientativo. Faltan horarios, reservas y tiempos
                        de traslado.
                      </div>
                      <div className="timeline">
                        {selectedVisits
                          .filter(
                            (v) =>
                              (trip.days[v.id] ?? trip.start) === selectedDay,
                          )
                          .map((v, i) => (
                            <article className="timeline-item" key={v.id}>
                              <div className="timeline-marker">{i + 1}</div>
                              <div className="timeline-card">
                                <div className="timeline-art">
                                  {v.research ? (
                                    <PhotoPending compact />
                                  ) : (
                                    <VisitArt kind={v.art} />
                                  )}
                                </div>
                                <div className="timeline-body">
                                  <span className="eyebrow">{v.category}</span>
                                  <h3>
                                    <button
                                      className="text-title"
                                      onClick={() => setDetail(v)}
                                    >
                                      {v.title}
                                    </button>
                                  </h3>
                                  <p>
                                    <MapPin size={14} />
                                    {v.town} <span>· {v.duration}</span>
                                  </p>
                                  <div className="timeline-controls">
                                    <SelectField
                                      id={`day-${v.id}`}
                                      label="Día de visita"
                                      value={trip.days[v.id] ?? trip.start}
                                      onChange={(e) => {
                                        update({
                                          ...trip,
                                          days: {
                                            ...trip.days,
                                            [v.id]: e.target.value,
                                          },
                                        });
                                        notify(
                                          "Visita trasladada al día elegido.",
                                        );
                                      }}
                                    >
                                      {days.map((d) => (
                                        <option key={d} value={d}>
                                          {dateLabel(d)}
                                        </option>
                                      ))}
                                    </SelectField>
                                    <Button
                                      variant="ghost"
                                      onClick={() => selectVisit(v.id)}
                                      aria-label={`Quitar ${v.title} del itinerario`}
                                    >
                                      <X size={17} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                        {!library.loading &&
                          !library.error &&
                          !selectedVisits.some(
                            (v) =>
                              (trip.days[v.id] ?? trip.start) === selectedDay,
                          ) && (
                            <Empty
                              title="Un día por escribir"
                              action={
                                <Button onClick={() => go("cultura")}>
                                  <Plus size={16} />
                                  Explorar visitas
                                </Button>
                              }
                            >
                              Añade una visita cultural o deja espacio para
                              improvisar.
                            </Empty>
                          )}
                        <article className="free-time">
                          <Utensils size={18} />
                          <div>
                            <strong>La pausa, donde apetezca.</strong>
                            <p>
                              Tiempo libre para comer y descubrir sabores sobre
                              la marcha.
                            </p>
                          </div>
                          <a href="#sabores" aria-label="Explorar qué probar">
                            <ArrowUpRight size={20} />
                          </a>
                        </article>
                      </div>
                    </section>
                    <aside className="panel checklist">
                      <p className="eyebrow">ANTES DE SALIR</p>
                      <h2>Pequeñas certezas.</h2>
                      {[
                        "Revisar transporte",
                        "Elegir alojamiento",
                        "Comprobar horarios y entradas",
                        "Consultar la agenda de ópera",
                      ].map((label, i) => (
                        <label key={label}>
                          <input
                            type="checkbox"
                            checked={trip.checked.includes(String(i))}
                            onChange={() =>
                              update({
                                ...trip,
                                checked: toggle(trip.checked, String(i)),
                              })
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                      <p className="muted">
                        Lista personal. Marcar una tarea no verifica sus datos
                        automáticamente.
                      </p>
                      <hr />
                      <span className="eyebrow">PRESUPUESTO POR PERSONA</span>
                      <strong className="budget-total">
                        {money(trip.budgetPerPerson)}
                      </strong>
                      <p className="muted">
                        {money(groupBudget(trip))} para {trip.travelers}{" "}
                        viajeros. Importes reales pendientes.
                      </p>
                    </aside>
                  </div>
                </>
              )}
            </>
          )}
          {page === "cultura" && (
            <>
              {heading(
                "VIAJAR ES MIRAR MÁS DE CERCA",
                "Visitas y cultura.",
                "Historia, arte y huellas de Roma. Lo que hace único cada lugar.",
                <Button onClick={() => setCoverage(true)}>
                  <CalendarDays size={17} />
                  Agendas culturales
                </Button>,
              )}
              {trip && (
                <ResearchPanel
                  key={`culture-${trip.id}`}
                  trip={trip}
                  provider={provider}
                  connections={connections.data}
                  beforeStart={notebook.flush}
                  onSave={saveProposal}
                  onExpired={onExpired}
                  onChanged={() => void connections.refresh()}
                  focus="culture"
                />
              )}
              <h2>
                {isExample
                  ? "Fichas de ejemplo y propuestas guardadas"
                  : "Propuestas guardadas en tu viaje"}
              </h2>
              <div className="culture-toolbar">
                <div className="search">
                  <Search size={18} />
                  <input
                    aria-label="Buscar visitas"
                    placeholder="Buscar un lugar o una ciudad…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      aria-label="Limpiar búsqueda"
                      onClick={() => setQuery("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <SelectField
                  id="town"
                  label="Ciudad"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                >
                  <option value="Todas">Todas las ciudades</option>
                  {[...new Set(availableVisits.map((v) => v.town))].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectField>
              </div>
              <div
                className="filter-tabs"
                role="group"
                aria-label="Categoría cultural"
              >
                {[
                  "Todo",
                  "Museos",
                  "Patrimonio romano",
                  "Ópera",
                  "Emblemáticos",
                  "Agenda cultural",
                ].map((c) => (
                  <button
                    key={c}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={category === c ? "selected" : ""}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="result-header">
                <p>
                  {filteredVisits.length}{" "}
                  {filteredVisits.length === 1
                    ? "idea para tu viaje"
                    : "ideas para tu viaje"}
                </p>
                <span>
                  <SlidersHorizontal size={14} />
                  Según tus intereses
                </span>
              </div>
              {filteredVisits.length ? (
                <div className="card-grid three">
                  {filteredVisits.map(visitCard)}
                </div>
              ) : (
                <Empty
                  title={
                    availableVisits.length
                      ? "No encontramos coincidencias"
                      : "Este destino está por descubrir"
                  }
                  action={
                    availableVisits.length ? (
                      <Button
                        onClick={() => {
                          setQuery("");
                          setCategory("Todo");
                          setTown("Todas");
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    ) : (
                      <Button onClick={() => go("ajustes")}>
                        Ver conexiones
                      </Button>
                    )
                  }
                >
                  {availableVisits.length
                    ? "Prueba otra búsqueda o cambia los filtros."
                    : "Estas fichas de ejemplo pertenecen a Puglia. Las propuestas del destino se muestran en Cultura con fuentes."}
                </Empty>
              )}
              <div className="culture-footer">
                <BookOpen size={20} />
                <p>
                  <strong>Elegidas por lo que te interesa.</strong> Las fichas
                  del ejemplo son ideas de visita. Horarios, precios y
                  disponibilidad todavía no se han consultado.
                </p>
              </div>
            </>
          )}
          {page === "sabores" && (
            <>
              {heading(
                "EL DESTINO TAMBIÉN SE SABOREA",
                "Qué probar.",
                "Platos con historia. El lugar donde probarlos lo decides tú.",
              )}
              {trip && (
                <ResearchPanel
                  key={`food-${trip.id}`}
                  trip={trip}
                  provider={provider}
                  connections={connections.data}
                  beforeStart={notebook.flush}
                  onSave={saveProposal}
                  onExpired={onExpired}
                  onChanged={() => void connections.refresh()}
                  focus="food"
                />
              )}
              <div className="food-intro">
                <div>
                  <span className="eyebrow">
                    {isExample
                      ? "FICHAS DE EJEMPLO · ITALIA / PUGLIA"
                      : "TU DESTINO"}
                  </span>
                  <h2>
                    Un viaje, también
                    <br />
                    <em>en el paladar.</em>
                  </h2>
                  <p>
                    Conoce los ingredientes, las tradiciones y los pequeños
                    sabores de cada región. Sin listas de restaurantes, sin
                    reservas.
                  </p>
                </div>
                {isExample && (
                  <div className="food-intro-art">
                    <FoodPhoto id="orecchiette" decorative />
                  </div>
                )}
              </div>
              <div
                className="filter-tabs"
                role="group"
                aria-label="Filtrar platos"
              >
                {["Todos", "Me interesan", "Probados"].map((t) => (
                  <button
                    key={t}
                    className={foodTab === t ? "selected" : ""}
                    aria-pressed={foodTab === t}
                    onClick={() => setFoodTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="card-grid three">
                {trip && (
                  <ResearchFoods
                    trip={trip}
                    jobs={library.jobs}
                    tab={foodTab}
                    update={update}
                  />
                )}
                {(isExample ? foods : [])
                  .filter(
                    (f) =>
                      foodTab === "Todos" ||
                      (foodTab === "Me interesan"
                        ? trip?.foodInterested.includes(f.id)
                        : trip?.tasted.includes(f.id)),
                  )
                  .map((f) => (
                    <article className="food-card" key={f.id}>
                      <FoodPhoto id={f.id} />
                      <div className="visit-content">
                        <div className="card-meta">
                          <span>{f.type}</span>
                          <span>{f.area}</span>
                        </div>
                        <h3>{f.name}</h3>
                        <p>{f.description}</p>
                        <details>
                          <summary>Ingredientes habituales</summary>
                          <p>{f.ingredients}</p>
                          <small>
                            Contenido ilustrativo sin fuente consultada.
                            Confirma los ingredientes de cada preparación.
                          </small>
                        </details>
                        <div className="food-actions">
                          <Button
                            aria-pressed={trip?.foodInterested.includes(f.id)}
                            onClick={() =>
                              trip &&
                              update({
                                ...trip,
                                foodInterested: toggle(
                                  trip.foodInterested,
                                  f.id,
                                ),
                              })
                            }
                          >
                            <Heart
                              size={15}
                              fill={
                                trip?.foodInterested.includes(f.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                            {trip?.foodInterested.includes(f.id)
                              ? "Quitar de intereses"
                              : "Me interesa"}
                          </Button>
                          <Button
                            aria-pressed={trip?.tasted.includes(f.id)}
                            className={
                              trip?.tasted.includes(f.id) ? "is-added" : ""
                            }
                            onClick={() =>
                              trip &&
                              update({
                                ...trip,
                                tasted: toggle(trip.tasted, f.id),
                              })
                            }
                          >
                            <Check size={16} />
                            {trip?.tasted.includes(f.id)
                              ? "Probado"
                              : "Lo he probado"}
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
              {((!isExample && !savedFoods.length) ||
                (foodTab !== "Todos" &&
                  !(
                    (isExample ? foods : []).some((f) =>
                      foodTab === "Me interesan"
                        ? trip?.foodInterested.includes(f.id)
                        : trip?.tasted.includes(f.id),
                    ) ||
                    savedFoods.some((f) =>
                      foodTab === "Me interesan"
                        ? trip?.foodInterested.includes(f.id)
                        : trip?.tasted.includes(f.id),
                    )
                  ))) && (
                <Empty
                  title={
                    isExample
                      ? "Tu lista está por estrenar"
                      : "Sabores por investigar"
                  }
                  action={
                    isExample ? (
                      <Button onClick={() => setFoodTab("Todos")}>
                        Ver todos los platos
                      </Button>
                    ) : undefined
                  }
                >
                  {isExample
                    ? "Marca los platos que te llamen la atención."
                    : "La gastronomía de ejemplo corresponde a Puglia; no se reutiliza para otros destinos."}
                </Empty>
              )}
              <p className="footnote">
                Las fichas guardadas conservan las fuentes de la investigación.
                Las de Puglia son ejemplos. No incluye establecimientos.
              </p>
            </>
          )}
          {page === "ajustes" && (
            <>
              {heading(
                "TU ESPACIO, TUS PREFERENCIAS",
                "Ajustes.",
                "Conexiones claras. Tú eliges cómo preparar el viaje.",
              )}
              <div className="settings-grid">
                <section className="panel">
                  <div className="section-heading">
                    <h2>El modelo que te acompaña</h2>
                    <Sparkles size={21} />
                  </div>
                  <p>
                    Elige el proveedor de la investigación. Solo uno activo cada
                    vez; sin cambios automáticos.
                  </p>
                  <div
                    className="provider-options"
                    role="group"
                    aria-label="Proveedor preferido"
                  >
                    {providers.map((p) => (
                      <button
                        key={p}
                        aria-pressed={provider === p}
                        className={provider === p ? "selected" : ""}
                        onClick={() => {
                          setProvider(p);
                          notify(
                            `Proveedor: ${p}. Se usará en la próxima investigación.`,
                          );
                        }}
                      >
                        <span className="provider-mark">
                          {p === "OpenAI"
                            ? "O"
                            : p === "Gemini"
                              ? "G"
                              : p === "Claude"
                                ? "C"
                                : "go"}
                        </span>
                        <span>
                          <strong>{p}</strong>
                          <small>
                            {connections.data?.providers.find(
                              (item) => item.name === p,
                            )?.configured
                              ? "Clave configurada"
                              : "Pendiente de configurar"}
                          </small>
                        </span>
                        {provider === p ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="notice">
                    {
                      "Las claves se configuran como secretos en Cloudflare. Se usa un proveedor por investigación. Elegir una opción no inicia llamadas ni cambia una investigación ya comenzada."
                    }
                  </div>
                  <div className="connection-row">
                    <span>Conexión activa</span>
                    <strong>
                      {connections.data?.providers.find(
                        (p) => p.name === provider && p.enabled && p.configured,
                      )
                        ? provider
                        : "Pendiente"}
                    </strong>
                  </div>
                  <div className="connection-row">
                    <span>Consultas reservadas este mes</span>
                    <strong>{connections.data?.ai.used ?? "—"}</strong>
                  </div>
                </section>
                <div>
                  <ConnectionStatus
                    data={connections.data}
                    error={connections.error}
                    retry={() => void connections.refresh()}
                  />
                  <section className="panel">
                    <div className="section-heading">
                      <h2>A tu gusto</h2>
                      <Sun size={21} />
                    </div>
                    <p>
                      El tema se guarda en este navegador. El proveedor
                      preferido se guarda con tu cuaderno.
                    </p>
                    <div className="theme-options">
                      <Button
                        aria-pressed={theme === "light"}
                        className={theme === "light" ? "selected" : ""}
                        onClick={() => setTheme("light")}
                      >
                        <Sun size={18} />
                        Claro
                      </Button>
                      <Button
                        aria-pressed={theme === "dark"}
                        className={theme === "dark" ? "selected" : ""}
                        onClick={() => setTheme("dark")}
                      >
                        <Moon size={18} />
                        Oscuro
                      </Button>
                    </div>
                  </section>
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Privacidad y acceso</h2>
                      <ShieldCheck size={21} />
                    </div>
                    <p>
                      Has entrado como {username}. La sesión finaliza a las dos
                      horas. Cierra la sesión al terminar en un equipo
                      compartido.
                    </p>
                    <div className="connection-row">
                      <span>Acceso privado</span>
                      <span className="badge">Activo</span>
                    </div>
                    <div className="connection-row">
                      <span>Guardado en el servidor</span>
                      <span className="badge">Activo</span>
                    </div>
                    {trip && (
                      <Button onClick={exportTrip}>
                        <Download size={17} />
                        Exportar borrador actual
                      </Button>
                    )}
                  </section>
                </div>
              </div>
              <div className="notice">
                <Info size={17} />
                <span>
                  Los viajes y la preferencia de IA se conservan en el servidor.
                  Las claves de IA se configurarán allí cuando conectemos el
                  modelo.
                </span>
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>
              <Logo /> <span>Para viajar con curiosidad.</span>
            </span>
            <span>Tu cuaderno de viaje · Itinera</span>
          </footer>
        </main>
      </div>
      {logoutConfirm && (
        <Dialog
          title="Cambios sin guardar"
          onClose={() => {
            if (!logoutBusy) setLogoutConfirm(false);
          }}
        >
          <p>
            No hemos podido confirmar el guardado. Puedes exportar tu cuaderno
            antes de salir. Al cerrar sesión se perderán los cambios que solo
            estén en esta pestaña.
          </p>
          {logoutError && (
            <p className="notice" role="alert">
              {logoutError}
            </p>
          )}
          <div className="dialog-actions">
            <Button
              autoFocus
              disabled={logoutBusy}
              onClick={() => setLogoutConfirm(false)}
            >
              Volver al cuaderno
            </Button>
            <Button disabled={logoutBusy} onClick={exportNotebook}>
              Exportar mis cambios
            </Button>
            <Button
              variant="danger"
              disabled={logoutBusy}
              onClick={() => void logout(true)}
            >
              {logoutBusy ? "Saliendo…" : "Cerrar sin guardar"}
            </Button>
          </div>
        </Dialog>
      )}
      {reloadConfirm && (
        <Dialog
          title="¿Cargar la versión guardada?"
          onClose={() => setReloadConfirm(false)}
        >
          <p>
            Se sustituirán los cambios pendientes de esta pestaña por el
            cuaderno del servidor. Exporta tus cambios antes de continuar.
          </p>
          <div className="dialog-actions">
            <Button autoFocus onClick={() => setReloadConfirm(false)}>
              Conservar mis cambios
            </Button>
            <Button
              onClick={() => {
                setReloadConfirm(false);
                void notebook.load();
              }}
            >
              Cargar versión guardada
            </Button>
          </div>
        </Dialog>
      )}
      {editor && (
        <TripEditor
          trip={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSave={async (next) => {
            setMutationBusy(true);
            try {
              await notebook.commit((data) => ({
                ...data,
                trips:
                  editor === "new"
                    ? [...data.trips, next]
                    : data.trips.map((t) => (t.id === next.id ? next : t)),
                active: next.id,
              }));
              setEditor(null);
              setDay("");
              go("itinerario");
              notify("Viaje guardado en el servidor.");
            } finally {
              setMutationBusy(false);
            }
          }}
        />
      )}
      {deleting && (
        <Dialog
          title="¿Eliminar este borrador?"
          onClose={() => {
            if (!mutationBusy) setDeleting(null);
          }}
        >
          <p>
            Se eliminará <strong>{deleting.destination}</strong> de tu cuaderno
            guardado. Sus selecciones y cambios no se podrán recuperar desde la
            aplicación.
          </p>
          {notebook.error && (
            <p className="notice" role="alert">
              {notebook.error}
            </p>
          )}
          <div className="dialog-actions">
            <Button
              autoFocus
              disabled={mutationBusy}
              onClick={() => setDeleting(null)}
            >
              Conservar viaje
            </Button>
            <Button
              variant="danger"
              disabled={mutationBusy}
              aria-busy={mutationBusy}
              onClick={async () => {
                setMutationBusy(true);
                try {
                  await notebook.commit((data) => {
                    const trips = data.trips.filter(
                      (t) => t.id !== deleting.id,
                    );
                    return {
                      ...data,
                      trips,
                      active: trips.some((t) => t.id === data.active)
                        ? data.active
                        : (trips[0]?.id ?? ""),
                    };
                  });
                  setDeleting(null);
                  notify("Viaje eliminado del cuaderno.");
                  requestAnimationFrame(() =>
                    document.getElementById("page-title")?.focus(),
                  );
                } catch {
                } finally {
                  setMutationBusy(false);
                }
              }}
            >
              Eliminar borrador
            </Button>
          </div>
        </Dialog>
      )}
      {detail && (
        <Dialog title={detail.title} onClose={() => setDetail(null)}>
          {detail.research ? <PhotoPending /> : <VisitArt kind={detail.art} />}
          <p className="eyebrow">
            {detail.category} · {detail.town}
          </p>
          <p>{detail.description}</p>
          <dl className="detail-list">
            <div>
              <dt>Duración</dt>
              <dd>{detail.duration}</dd>
            </div>
            <div>
              <dt>Precio</dt>
              <dd>Pendiente de consulta</dd>
            </div>
            <div>
              <dt>Horario y disponibilidad</dt>
              <dd>Sin comprobar</dd>
            </div>
          </dl>
          {detail.research && trip ? (
            <ResearchEvidence {...detail.research} trip={trip} />
          ) : (
            <div className="notice">
              Ficha de ejemplo. El enlace de referencia no acredita una consulta
              ni disponibilidad para tus fechas.
            </div>
          )}
          <div className="dialog-actions">
            <a
              className="button secondary"
              href={detail.source}
              target="_blank"
              rel="noreferrer"
            >
              Web de referencia
              <ExternalLink size={16} />
            </a>
            <Button
              variant="primary"
              onClick={() => {
                selectVisit(detail.id);
                setDetail(null);
              }}
            >
              {trip?.selected.includes(detail.id)
                ? "Quitar del itinerario"
                : "Añadir al itinerario"}
            </Button>
          </div>
        </Dialog>
      )}
      {coverage && (
        <Dialog title="Agendas culturales" onClose={() => setCoverage(false)}>
          <p>
            Las fuentes localizadas y su estado de lectura se muestran en
            «Cultura con fuentes». Esta primera investigación consulta un
            conjunto limitado de páginas.
          </p>
          <div className="notice">
            La revisión completa de agendas por ciudad, museos y teatros sigue
            pendiente. Una programación anunciada no confirma entradas
            disponibles. Si no encontramos ópera, no podemos concluir que no
            haya funciones.
          </div>
          <Button
            onClick={() => {
              setCoverage(false);
              go("ajustes");
            }}
          >
            Ver conexiones
            <ArrowRight size={16} />
          </Button>
        </Dialog>
      )}
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}

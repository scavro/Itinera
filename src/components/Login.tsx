import { useTheme } from "../theme";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Moon, Sun } from "lucide-react";
import { Button, Field } from "./ui";
import { Logo } from "./Logo";
import { JourneyArt } from "./Artwork";
import { api, ApiError } from "../api";
export function Login({
  onSuccess,
  expired = false,
}: {
  onSuccess: () => Promise<void>;
  expired?: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({ username: "", password: "" });
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    document.title = "Entrar · Itinera";
    document.getElementById("login-title")?.focus();
  }, []);
  const changeTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };
  return (
    <main className="auth-page">
      <div className="auth-landscape">
        <JourneyArt />
        <div className="auth-landscape-copy">
          <p className="eyebrow">VIAJA A TU MANERA</p>
          <h2>
            El próximo capítulo
            <br />
            <em>te está esperando.</em>
          </h2>
          <p>Historia, arte y lugares que merece la pena descubrir.</p>
        </div>
        <span className="auth-art-caption">
          Paisaje de inspiración · Ilustración
        </span>
      </div>
      <section className="auth-panel">
        <div className="auth-top">
          <Logo />
          <button
            className="theme-toggle"
            onClick={changeTheme}
            aria-label={`Activar modo ${theme === "light" ? "oscuro" : "claro"}`}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
        <div className="auth-form-wrap">
          <p className="eyebrow">
            <LockKeyhole size={14} /> TU ESPACIO PERSONAL
          </p>
          <h1 id="login-title" tabIndex={-1}>
            Vuelve a tu cuaderno.
          </h1>
          <p className="subtitle">Entra para continuar con tus viajes.</p>
          {expired && (
            <p className="notice">
              Tu sesión ha finalizado. Vuelve a entrar para continuar. Los
              cambios pendientes siguen en esta pestaña.
            </p>
          )}
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              const next = {
                username: username.trim()
                  ? ""
                  : "Escribe tu nombre de usuario.",
                password: password ? "" : "Escribe tu contraseña.",
              };
              setErrors(next);
              setError("");
              if (next.username || next.password) {
                document
                  .getElementById(next.username ? "username" : "password")
                  ?.focus();
                return;
              }
              setBusy(true);
              try {
                await api("/api/auth/sign-in/username", {
                  method: "POST",
                  body: JSON.stringify({ username: username.trim(), password }),
                });
                setPassword("");
                await onSuccess();
              } catch (e) {
                setError(
                  e instanceof ApiError && [400, 401, 403].includes(e.status)
                    ? "Usuario o contraseña incorrectos."
                    : (e as Error).message,
                );
                setPassword("");
              } finally {
                setBusy(false);
                requestAnimationFrame(() =>
                  document.getElementById("password")?.focus(),
                );
              }
            }}
          >
            <Field
              id="username"
              label="Nombre de usuario"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              maxLength={100}
              disabled={busy}
            />
            <div className="password-wrap">
              <Field
                id="password"
                label="Contraseña"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                maxLength={128}
                disabled={busy}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <div className="auth-error" role="alert">
              {error}
            </div>
            <Button
              type="submit"
              variant="primary"
              className="auth-submit"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? "Entrando…" : "Entrar a mi cuaderno"}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="auth-help">
            Al terminar en un equipo compartido, cierra la sesión.
          </p>
        </div>
        <p className="auth-bottom">Tu cuaderno de viaje. Siempre contigo.</p>
      </section>
    </main>
  );
}

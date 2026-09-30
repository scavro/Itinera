import {
  useEffect,
  useId,
  useRef,
  useContext,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { X, Compass } from "lucide-react";
import { SessionBlocked } from "../sessionContext";
export function Button({
  children,
  variant = "secondary",
  className = "",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      {...props}
      data-initial-focus={props.autoFocus || undefined}
      onClick={onClick}
      className={`button ${variant} ${className}`}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        data-initial-focus={props.autoFocus || undefined}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
export function SelectField({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select {...props} id={id}>
        {children}
      </select>
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const previous = useRef(document.activeElement as HTMLElement);
  const suspended = useContext(SessionBlocked);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (suspended) {
      ref.current?.close();
      return;
    }
    if (!ref.current?.open) ref.current?.showModal();
    ref.current?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      ref.current?.close();
      document.body.style.overflow = overflow;
      previous.current?.focus();
    };
  }, [suspended]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" onClick={onClose} aria-label="Cerrar diálogo">
          <X size={20} />
        </Button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Compass size={34} />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  return (
    <div className={`toast ${message ? "visible" : ""}`} role="status">
      {message}
      {message && (
        <button aria-label="Cerrar aviso" onClick={onClose}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

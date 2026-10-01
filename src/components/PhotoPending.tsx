import { Landmark, Utensils } from "lucide-react";
export function PhotoPending({
  kind = "visit",
  compact = false,
}: {
  kind?: "visit" | "food";
  compact?: boolean;
}) {
  const Icon = kind === "food" ? Utensils : Landmark;
  return (
    <div className={`photo-pending${compact ? " compact" : ""}`}>
      <Icon size={28} aria-hidden="true" />
      <span>Fotografía real pendiente</span>
    </div>
  );
}

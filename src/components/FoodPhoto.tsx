import { foodPhotos } from "../media";

export function FoodPhoto({
  id,
  decorative = false,
}: {
  id: keyof typeof foodPhotos;
  decorative?: boolean;
}) {
  const photo = foodPhotos[id];
  return (
    <figure className={`food-photo ${decorative ? "intro-photo" : ""}`}>
      <img
        src={photo.src}
        alt={decorative ? "" : photo.alt}
        loading={decorative ? "eager" : "lazy"}
        decoding="async"
      />
      <figcaption>
        Foto:{" "}
        <a href={photo.source} target="_blank" rel="noreferrer">
          {photo.author}
        </a>
        {" · "}
        <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
          {photo.license}
        </a>
      </figcaption>
    </figure>
  );
}

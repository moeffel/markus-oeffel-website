type ProfilePhotoProps = {
  alt: string;
  size?: number;
  priority?: boolean;
  className?: string;
};

export const PROFILE_PHOTO_SRC = "/profile.png";

function normalizePhotoSrc(input: string): string {
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.startsWith("/")) return input;
  return `/${input}`;
}

export function ProfilePhoto({
  alt,
  size = 56,
  priority,
  className,
}: ProfilePhotoProps) {
  const src = normalizePhotoSrc(PROFILE_PHOTO_SRC);

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5 shadow-[0_0_0_1px_rgba(93,217,255,0.18),0_0_28px_rgba(93,217,255,0.12)]",
        className ?? "",
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-[rgba(226,107,255,0.22)]" />
    </div>
  );
}

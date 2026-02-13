type ProfilePhotoProps = {
  alt: string;
  size?: number;
  width?: number;
  height?: number;
  fit?: "contain" | "cover";
  priority?: boolean;
  className?: string;
};

function normalizePhotoSrc(input: string): string {
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.startsWith("/")) return input;
  return `/${input}`;
}

export function ProfilePhoto({
  alt,
  size = 56,
  width,
  height,
  fit = "contain",
  priority,
  className,
}: ProfilePhotoProps) {
  const src = normalizePhotoSrc(
    process.env.NEXT_PUBLIC_PROFILE_PHOTO ?? "/profile.jpeg",
  );
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#060c16] shadow-[0_0_0_1px_rgba(93,217,255,0.18),0_0_28px_rgba(93,217,255,0.12)]",
        className ?? "",
      ].join(" ")}
      style={{ width: finalWidth, height: finalHeight }}
    >
      <img
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={[
          "h-full w-full",
          fit === "contain" ? "object-contain object-center" : "object-cover object-top",
        ].join(" ")}
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[rgba(226,107,255,0.22)]" />
    </div>
  );
}

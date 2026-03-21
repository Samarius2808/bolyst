"use client";

export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      className="w-full h-full object-contain sm:object-cover"
    >
      <source src={src} type="video/mp4" />
      {/* Fallback to poster image if video not available */}
      <img src={poster} alt="Bolyst board view" className="w-full" />
    </video>
  );
}

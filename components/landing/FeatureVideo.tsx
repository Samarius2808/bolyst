"use client";

import { useRef, useEffect } from "react";

export function FeatureVideo({
  src,
  poster,
  playing,
}: {
  src: string;
  poster: string;
  playing: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (playing) {
      ref.current.play();
    } else {
      ref.current.pause();
      ref.current.removeAttribute("src");
      ref.current.load();
    }
  }, [playing]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      poster={poster}
      className="w-full"
    >
      <source src={src} type="video/mp4" />
      <img src={poster} alt="" className="w-full" />
    </video>
  );
}

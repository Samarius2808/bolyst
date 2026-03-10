"use client";

import { useState } from "react";
import { FeatureVideo } from "./FeatureVideo";

export function FeatureCard({
  icon,
  title,
  description,
  videoSrc,
  videoPoster,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  videoSrc: string;
  videoPoster: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl border border-zinc-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-11 h-11 rounded-xl bg-sage-50 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-[15px] font-bold text-zinc-900 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      <div className="mt-5 rounded-xl border border-zinc-100 overflow-hidden">
        <FeatureVideo src={videoSrc} poster={videoPoster} playing={hovered} />
      </div>
    </div>
  );
}

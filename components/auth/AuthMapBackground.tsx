"use client";

const PINS = [
  { top: "18%", left: "22%", delay: "0s", float: "3.2s" },
  { top: "35%", left: "68%", delay: "0.4s", float: "3.8s" },
  { top: "55%", left: "40%", delay: "0.8s", float: "4.1s" },
  { top: "28%", left: "50%", delay: "1.2s", float: "3.5s" },
  { top: "65%", left: "75%", delay: "0.2s", float: "4.4s" },
  { top: "45%", left: "15%", delay: "1.0s", float: "3.0s" },
  { top: "72%", left: "55%", delay: "0.6s", float: "3.7s" },
  { top: "20%", left: "80%", delay: "1.4s", float: "4.0s" },
];

export function AuthMapBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Map tile background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(https://cartodb-basemaps-a.global.ssl.fastly.net/voyager/5/16/10.png)",
          backgroundSize: "256px 256px",
          backgroundRepeat: "repeat",
          filter: "blur(1.5px) saturate(0.3) brightness(1.05)",
        }}
      />

      {/* Sage tint overlay */}
      <div className="absolute inset-0 bg-sage-100/70" />

      {/* Animated pins */}
      {PINS.map((pin, i) => (
        <div
          key={i}
          className="absolute animate-[pinDrop_0.5s_ease-out_both]"
          style={{
            top: pin.top,
            left: pin.left,
            animationDelay: pin.delay,
          }}
        >
          <div
            style={{
              animation: `pinFloat ${pin.float} ease-in-out infinite`,
              animationDelay: pin.delay,
            }}
          >
            {/* Pin shadow */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-sage-900/15 rounded-full blur-[2px]" />
            {/* Pin body */}
            <div className="relative">
              <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                  className="fill-sage-500"
                />
                <circle cx="12" cy="11" r="4.5" className="fill-white/90" />
              </svg>
            </div>
          </div>
        </div>
      ))}

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(244,247,242,0.6) 100%)",
        }}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

// ── Isometric projection ─────────────────────────────────────────────────────
// x-axis: goes right+down in screen space
// y-axis: goes left+down in screen space
// z-axis: goes straight up
const W = 48;   // screen px per grid unit (horizontal)
const H = 24;   // screen px per grid unit (vertical, = W/2)
const Z = 52;   // screen px per height unit

const OX = 868; // screen origin x
const OY = 520; // screen origin y

function sx(x: number, y: number)              { return OX + (x - y) * W; }
function sy(x: number, y: number, z: number)   { return OY + (x + y) * H - z * Z; }
function pt(x: number, y: number, z: number)   { return `${sx(x,y)},${sy(x,y,z)}`; }
function pp(...args: [number,number,number][])  { return args.map(([x,y,z]) => pt(x,y,z)).join(" "); }

// ── Palette ──────────────────────────────────────────────────────────────────
const DGR = "#4e7248";   // dark green right face
const DGL = "#3b5535";   // dark green left face
const DGT = "#6e9660";   // dark green top
const TWR_TOP = "#bcd8c0"; // tower mint top
const CR  = "#e4d8bc";   // cream right face
const CL  = "#cfc3a4";   // cream left face
const CT  = "#f2ead4";   // cream top
const MR  = "#9ecba6";   // mint right face
const ML  = "#7dab86";   // mint left face
const MT  = "#c2dcc8";   // mint top
const TERRA     = "#c4826a";   // terracotta
const TERRA_D   = "#aa6a55";   // terracotta dark
const WIN_DK    = "#2d4428";   // dark window (recessed look on DGL left faces)
const WIN_LT    = "#bcd4b8";   // lit window (green buildings)
const WIN_CR    = "#cdc3a0";   // window on cream
const WIN_ML    = "#649a6e";   // window on mint left face (darker than ML, visible)
const OLIVE_TOP = "#8a9d60";   // house pitched roof
const OLIVE_D   = "#6e7e4c";   // house roof shadow

// ── Dark mode window colors ─────────────────────────────────────────────────
const WIN_GLOW   = "#f5d68a";   // warm amber lit window
const WIN_OFF_G  = "#2e4428";   // unlit window on green buildings
const WIN_OFF_C  = "#7a7362";   // unlit window on cream buildings
const WIN_OFF_DK = "#1a2b16";   // unlit dark window
const WIN_OFF_M  = "#4a7a52";   // unlit mint window
const WIN_OFF_ML = "#3d6a45";   // unlit mint-left window

// Dark-mode building face colors (muted)
const DGR_D  = "#344b30";
const DGL_D  = "#283d22";
const DGT_D  = "#4a6e42";
const TWR_D  = "#7a9e80";
const CR_D   = "#8a7e68";
const CL_D   = "#7a7060";
const CT_D   = "#9a9280";
const MR_D   = "#6a9a72";
const ML_D   = "#558060";
const MT_D   = "#82a888";
const TERRA_DD  = "#8a5a48";
const TERRA_DD2 = "#704838";

// ── Which windows glow in dark mode ─────────────────────────────────────────
// Keys match the existing React key format: prefix + row + col
const LIT = new Set([
  // Tower (T) — right face
  "tr11", "tr40",
  // Tower — left face
  "tl20", "tl51",
  // Cream building (CB) — right
  "cr01", "cr20",
  // Cream building — left
  "cl10",
  // Central (CN) — right
  "cnr10", "cnr31",
  // Central — left
  "cnl01", "cnl40",
  // House (HO) — right
  "hor0",
  // House — left
  "hol1",
  // BTL (tall left tower) — right
  "btlr01", "btlr30", "btlr61",
  // BTL — left
  "btll20", "btll51",
  // BLD (tall dark left) — right
  "bldr20", "bldr51",
  // BLD — left
  "bldl11", "bldl40",
  // BBR (bridge) — right
  "bbrr01", "bbrr30",
  // BBR — left
  "bbrl10", "bbrl21",
  // SM (small mint) — right
  "smr10",
  // BLC (left cream) — right
  "blcr11", "blcr30",
  // BLC — left
  "blcl00", "blcl21",
  // BFS (far small) — right
  "bfsr1",
  // BVF (very far tiny) — right
  "bvfr0",
]);

// ── Sub-components ───────────────────────────────────────────────────────────

// A rectangular box: 3 visible faces (right +x, left +y, top)
function Box({ x, y, w, d, h, T, R, L }: {
  x: number; y: number; w: number; d: number; h: number;
  T: string; R: string; L: string;
}) {
  return (
    <g>
      {/* right face (x = x+w) */}
      <polygon fill={R} points={pp([x+w,y,0],[x+w,y+d,0],[x+w,y+d,h],[x+w,y,h])} style={FACE_STYLE} />
      {/* left face (y = y+d) */}
      <polygon fill={L} points={pp([x,y+d,0],[x+w,y+d,0],[x+w,y+d,h],[x,y+d,h])} style={FACE_STYLE} />
      {/* top face */}
      <polygon fill={T} points={pp([x,y,h],[x+w,y,h],[x+w,y+d,h],[x,y+d,h])} style={FACE_STYLE} />
    </g>
  );
}

const WIN_STYLE: React.CSSProperties = { transition: "fill 1.2s ease" };
const FACE_STYLE: React.CSSProperties = { transition: "fill 1.2s ease" };

// Small rectangle on right face (constant x = bx+bw)
function WinR({ bx,by,bw,bd,bh,u,v,wu,wv,fill,filter: f }: {
  bx:number;by:number;bw:number;bd:number;bh:number;
  u:number;v:number;wu:number;wv:number;fill:string;filter?:string;
}) {
  const y0 = by + bd*(1-u), y1 = by + bd*(1-u-wu);
  const z0 = bh*v,          z1 = bh*(v+wv);
  return <polygon fill={fill} points={pp([bx+bw,y0,z0],[bx+bw,y1,z0],[bx+bw,y1,z1],[bx+bw,y0,z1])} style={WIN_STYLE} filter={f} />;
}

// Small rectangle on left face (constant y = by+bd)
function WinL({ bx,by,bw,bd,bh,u,v,wu,wv,fill,filter: f }: {
  bx:number;by:number;bw:number;bd:number;bh:number;
  u:number;v:number;wu:number;wv:number;fill:string;filter?:string;
}) {
  const x0 = bx+bw*u, x1 = bx+bw*(u+wu);
  const z0 = bh*v,     z1 = bh*(v+wv);
  return <polygon fill={fill} points={pp([x0,by+bd,z0],[x1,by+bd,z0],[x1,by+bd,z1],[x0,by+bd,z1])} style={WIN_STYLE} filter={f} />;
}

// Arched window on right face
function ArchWinR({ bx,by,bw,bd,bh,u,v,wu,wv,fill,archRatio=0.45,filter: f }: {
  bx:number;by:number;bw:number;bd:number;bh:number;
  u:number;v:number;wu:number;wv:number;fill:string;archRatio?:number;filter?:string;
}) {
  const y0=by+bd*(1-u), y1=by+bd*(1-u-wu), ym=(y0+y1)/2;
  const z0=bh*v, z1=bh*(v+wv), za=z0+(z1-z0)*(1-archRatio);
  const fp=(x:number,y:number,z:number)=>`${sx(x,y)},${sy(x,y,z)}`;
  const d=`M ${fp(bx+bw,y0,z0)} L ${fp(bx+bw,y1,z0)} L ${fp(bx+bw,y1,za)} Q ${fp(bx+bw,y1,z1)} ${fp(bx+bw,ym,z1)} Q ${fp(bx+bw,y0,z1)} ${fp(bx+bw,y0,za)} Z`;
  return <path fill={fill} d={d} style={WIN_STYLE} filter={f} />;
}

// Arched window on left face
function ArchWinL({ bx,by,bw,bd,bh,u,v,wu,wv,fill,archRatio=0.45,filter: f }: {
  bx:number;by:number;bw:number;bd:number;bh:number;
  u:number;v:number;wu:number;wv:number;fill:string;archRatio?:number;filter?:string;
}) {
  const x0=bx+bw*u, x1=bx+bw*(u+wu), xm=(x0+x1)/2;
  const z0=bh*v, z1=bh*(v+wv), za=z0+(z1-z0)*(1-archRatio);
  const fp=(x:number,y:number,z:number)=>`${sx(x,y)},${sy(x,y,z)}`;
  const d=`M ${fp(x0,by+bd,z0)} L ${fp(x1,by+bd,z0)} L ${fp(x1,by+bd,za)} Q ${fp(x1,by+bd,z1)} ${fp(xm,by+bd,z1)} Q ${fp(x0,by+bd,z1)} ${fp(x0,by+bd,za)} Z`;
  return <path fill={fill} d={d} style={WIN_STYLE} filter={f} />;
}

// ── Main component ────────────────────────────────────────────────────────────
export function IsometricCity({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  // Fill helpers — map light-mode fill to dark-mode equivalent
  const darkOf = (base: string) => {
    if (base === WIN_LT) return WIN_OFF_G;
    if (base === WIN_DK) return WIN_OFF_DK;
    if (base === WIN_CR) return WIN_OFF_C;
    if (base === MT)     return WIN_OFF_M;
    if (base === ML)     return WIN_OFF_ML;
    if (base === WIN_ML) return WIN_OFF_ML;
    return base;
  };

  // Get window fill: in dark mode, lit windows glow amber, unlit go dark
  const wf = (base: string, key: string) => {
    if (!isDark) return base;
    return LIT.has(key) ? WIN_GLOW : darkOf(base);
  };

  // Get glow filter for lit windows
  const gf = (key: string) => isDark && LIT.has(key) ? "url(#windowGlow)" : undefined;

  // Building face colors (transition in dark mode)
  const dgr = isDark ? DGR_D : DGR;
  const dgl = isDark ? DGL_D : DGL;
  const dgt = isDark ? DGT_D : DGT;
  const twr = isDark ? TWR_D : TWR_TOP;
  const cr  = isDark ? CR_D  : CR;
  const cl  = isDark ? CL_D  : CL;
  const ct  = isDark ? CT_D  : CT;
  const mr  = isDark ? MR_D  : MR;
  const ml  = isDark ? ML_D  : ML;
  const mt  = isDark ? MT_D  : MT;
  const terra   = isDark ? TERRA_DD  : TERRA;
  const terra_d = isDark ? TERRA_DD2 : TERRA_D;

  // Building positions [x, y, w, d, h]
  // Drawing order: back -> front (painter's algorithm, sort by front-corner x+y)

  // ── RIGHT CLUSTER (original) ───────────────────────────────────────────────
  const T  = { x:6,   y:0,   w:2.5, d:2.5, h:7.5 }; // tall tower, back-right
  const CB = { x:3.5, y:0.5, w:2.5, d:2,   h:5.5 }; // cream building, center-back
  const HO = { x:1,   y:3,   w:2.5, d:2,   h:3   }; // house with pitched roof
  const CN = { x:4,   y:2.5, w:2.5, d:2,   h:5.5 }; // central dark building
  const SM = { x:6.5, y:3.5, w:2,   d:1.5, h:2.5 }; // small mint, front-right

  // ── LEFT EXTENSION (new buildings, higher y -> further left on screen) ──────
  const BFS = { x:-3,  y:6,   w:2,   d:1.5, h:2.5 }; // far-back small mint   sum=6.5
  const BVF = { x:-4,  y:7,   w:1.5, d:1.5, h:2   }; // very-far tiny cream   sum=6
  const BLC = { x:-1,  y:6,   w:2,   d:2,   h:4   }; // left cream, mid-height sum=9
  const BLD = { x:-2,  y:7,   w:2.5, d:2,   h:5   }; // left dark, tall        sum=9.5
  const BBR = { x:1,   y:7,   w:2,   d:2,   h:3.5 }; // bridge piece           sum=12
  const BTL = { x:-4,  y:9,   w:2.5, d:2.5, h:7   }; // tall left tower        sum=10

  return (
    <svg
      viewBox="0 0 1400 780"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* ── Glow filter for lit windows ──────────────────────────────────── */}
      <defs>
        <filter id="windowGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0.2
                    0 0.8 0 0 0.15
                    0 0 0.3 0 0
                    0 0 0 1.5 0"
            result="warmBlur" />
          <feMerge>
            <feMergeNode in="warmBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Ground plane — shared surface so all buildings read as same floor ── */}
      <polygon
        fill={isDark ? "rgba(50,60,42,0.07)" : "rgba(100,120,80,0.045)"}
        points={pp([-6,-2,0],[12,-2,0],[12,14,0],[-6,14,0])}
        style={FACE_STYLE}
      />

      {/* ── Shadows ─────────────────────────────────────────────────────────── */}
      <ellipse cx={sx(7.25,1.25)} cy={sy(7.25,1.25,0)+8} rx={135} ry={24}
        fill="rgba(60,80,50,0.08)" />
      <ellipse cx={sx(4.75,1.5)}  cy={sy(4.75,1.5,0)+6}  rx={105} ry={18}
        fill="rgba(60,80,50,0.07)" />
      <ellipse cx={sx(5.25,3.5)}  cy={sy(5.25,3.5,0)+6}  rx={105} ry={18}
        fill="rgba(60,80,50,0.07)" />
      <ellipse cx={sx(2.25,4)}    cy={sy(2.25,4,0)+5}     rx={80}  ry={15}
        fill="rgba(60,80,50,0.07)" />
      <ellipse cx={sx(7.5,4.25)}  cy={sy(7.5,4.25,0)+5}  rx={75}  ry={14}
        fill="rgba(60,80,50,0.06)" />
      {/* new left shadows */}
      <ellipse cx={sx(-0.5,7.5)}  cy={sy(-0.5,7.5,0)+6}  rx={110} ry={18}
        fill="rgba(60,80,50,0.07)" />
      <ellipse cx={sx(0,7)}       cy={sy(0,7,0)+5}        rx={90}  ry={15}
        fill="rgba(60,80,50,0.06)" />
      <ellipse cx={sx(2,8)}       cy={sy(2,8,0)+4}        rx={90}  ry={15}
        fill="rgba(60,80,50,0.06)" />
      <ellipse cx={sx(-3.5,7.5)}  cy={sy(-3.5,7.5,0)+4}  rx={65}  ry={12}
        fill="rgba(60,80,50,0.05)" />

      {/* ══════════════════════════════════════════════════════════════════════
          BUILDINGS — back to front (sorted by front-corner x+y)
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ── BVF: tiny cream, very far left (sum~6) ──────────────────────────── */}
      <g>
        <Box {...BVF} T={ct} R={cr} L={cl} />
        {(() => { const k = "bvfr0"; return (
          <WinR bx={BVF.x} by={BVF.y} bw={BVF.w} bd={BVF.d} bh={BVF.h}
                u={0.15} v={0.45} wu={0.32} wv={0.25} fill={wf(WIN_CR, k)} filter={gf(k)} />
        ); })()}
        <WinL bx={BVF.x} by={BVF.y} bw={BVF.w} bd={BVF.d} bh={BVF.h}
              u={0.15} v={0.45} wu={0.32} wv={0.25} fill={wf(WIN_CR, "bvfl0")} filter={gf("bvfl0")} />
      </g>

      {/* ── BFS: small mint, far back-left (sum~6.5) ────────────────────────── */}
      <g>
        <Box {...BFS} T={mt} R={mr} L={ml} />
        {[0, 1].map(i => {
          const us = [0.1, 0.55];
          const k = `bfsr${i}`;
          return (
            <WinR key={k} bx={BFS.x} by={BFS.y} bw={BFS.w} bd={BFS.d} bh={BFS.h}
                  u={us[i]} v={0.4} wu={i === 0 ? 0.32 : 0.3} wv={0.25}
                  fill={wf(MT, k)} filter={gf(k)} />
          );
        })}
        <WinL bx={BFS.x} by={BFS.y} bw={BFS.w} bd={BFS.d} bh={BFS.h}
              u={0.1} v={0.4} wu={0.35} wv={0.25} fill={wf(WIN_ML, "bfsl0")} filter={gf("bfsl0")} />
        <WinL bx={BFS.x} by={BFS.y} bw={BFS.w} bd={BFS.d} bh={BFS.h}
              u={0.55} v={0.4} wu={0.3} wv={0.25} fill={wf(WIN_ML, "bfsl1")} filter={gf("bfsl1")} />
      </g>

      {/* ── HOUSE (pitched roof, far left) ─────────────────────────────────── */}
      <g>
        <Box {...HO} T={isDark ? OLIVE_D : OLIVE_TOP} R={dgr} L={dgl} />

        {/* Windows right face */}
        {(() => { const k = "hor0"; return (
          <WinR bx={HO.x} by={HO.y} bw={HO.w} bd={HO.d} bh={HO.h}
                u={0.15} v={0.55} wu={0.32} wv={0.28} fill={wf(WIN_LT, k)} filter={gf(k)} />
        ); })()}
        {(() => { const k = "hor1"; return (
          <WinR bx={HO.x} by={HO.y} bw={HO.w} bd={HO.d} bh={HO.h}
                u={0.58} v={0.55} wu={0.28} wv={0.28} fill={wf(WIN_LT, k)} filter={gf(k)} />
        ); })()}
        {/* Windows left face */}
        {(() => { const k = "hol0"; return (
          <WinL bx={HO.x} by={HO.y} bw={HO.w} bd={HO.d} bh={HO.h}
                u={0.15} v={0.55} wu={0.3} wv={0.28} fill={wf(WIN_DK, k)} filter={gf(k)} />
        ); })()}
        {(() => { const k = "hol1"; return (
          <WinL bx={HO.x} by={HO.y} bw={HO.w} bd={HO.d} bh={HO.h}
                u={0.58} v={0.55} wu={0.28} wv={0.28} fill={wf(WIN_LT, k)} filter={gf(k)} />
        ); })()}

        {/* Gable end on right side */}
        <polygon fill={dgr} points={pp(
          [HO.x+HO.w, HO.y,      HO.h],
          [HO.x+HO.w, HO.y+HO.d, HO.h],
          [HO.x+HO.w, HO.y+HO.d/2, HO.h+1.6],
        )} style={FACE_STYLE} />

        {/* Pitched roof: front slope */}
        <polygon fill={isDark ? "#4e5e38" : OLIVE_D} points={pp(
          [HO.x,       HO.y+HO.d,   HO.h],
          [HO.x+HO.w,  HO.y+HO.d,   HO.h],
          [HO.x+HO.w,  HO.y+HO.d/2, HO.h+1.6],
          [HO.x,       HO.y+HO.d/2, HO.h+1.6],
        )} style={FACE_STYLE} />

        {/* Circular window on gable */}
        {(() => {
          const cx2 = sx(HO.x+HO.w, HO.y + HO.d*0.5);
          const cy2 = sy(HO.x+HO.w, HO.y + HO.d*0.5, HO.h + 0.55);
          return <ellipse cx={cx2} cy={cy2} rx={7} ry={7} fill={isDark ? WIN_OFF_DK : WIN_DK} style={WIN_STYLE} />;
        })()}
      </g>

      {/* ── CREAM BUILDING (center-back, sum=8.5) ───────────────────────────── */}
      <g>
        <Box {...CB} T={ct} R={cr} L={cl} />
        {[0.2, 0.42, 0.64].map((v, row) =>
          [0.1, 0.5].map((u, col) => {
            const k = `cr${row}${col}`;
            return (
              <WinR key={k}
                bx={CB.x} by={CB.y} bw={CB.w} bd={CB.d} bh={CB.h}
                u={u} v={v} wu={0.28} wv={0.17} fill={wf(WIN_CR, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.2, 0.42, 0.64].map((v, row) =>
          [0.1, 0.5].map((u, col) => {
            const k = `cl${row}${col}`;
            return (
              <WinL key={k}
                bx={CB.x} by={CB.y} bw={CB.w} bd={CB.d} bh={CB.h}
                u={u} v={v} wu={0.28} wv={0.17} fill={wf(WIN_CR, k)} filter={gf(k)} />
            );
          })
        )}
      </g>

      {/* ── BLC: medium cream building, center-left (sum=9) ─────────────────── */}
      <g>
        <Box {...BLC} T={ct} R={cr} L={cl} />
        {[0.18, 0.38, 0.58, 0.78].map((v, row) =>
          [0.1, 0.55].map((u, col) => {
            const k = `blcr${row}${col}`;
            return (
              <WinR key={k}
                bx={BLC.x} by={BLC.y} bw={BLC.w} bd={BLC.d} bh={BLC.h}
                u={u} v={v} wu={0.28} wv={0.16} fill={wf(WIN_CR, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.18, 0.38, 0.58, 0.78].map((v, row) =>
          [0.1, 0.55].map((u, col) => {
            const k = `blcl${row}${col}`;
            return (
              <WinL key={k}
                bx={BLC.x} by={BLC.y} bw={BLC.w} bd={BLC.d} bh={BLC.h}
                u={u} v={v} wu={0.28} wv={0.16} fill={wf(WIN_CR, k)} filter={gf(k)} />
            );
          })
        )}
      </g>

      {/* ── BLD: tall dark green, left (sum=9.5) ────────────────────────────── */}
      <g>
        <Box {...BLD} T={dgt} R={dgr} L={dgl} />
        {[0.1, 0.22, 0.35, 0.48, 0.61, 0.74, 0.87].map((v, row) =>
          [0.08, 0.54].map((u, col) => {
            const k = `bldr${row}${col}`;
            return (
              <WinR key={k}
                bx={BLD.x} by={BLD.y} bw={BLD.w} bd={BLD.d} bh={BLD.h}
                u={u} v={v} wu={0.3} wv={0.1} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.2, 0.33, 0.46, 0.59, 0.72, 0.85].map((v, i) => (
          <WinR key={`bldtb${i}`}
            bx={BLD.x} by={BLD.y} bw={BLD.w} bd={BLD.d} bh={BLD.h}
            u={0.04} v={v} wu={0.88} wv={0.02} fill={terra} />
        ))}
        {[0.1, 0.22, 0.35, 0.48, 0.61, 0.74, 0.87].map((v, row) =>
          [0.08, 0.54].map((u, col) => {
            const k = `bldl${row}${col}`;
            return (
              <WinL key={k}
                bx={BLD.x} by={BLD.y} bw={BLD.w} bd={BLD.d} bh={BLD.h}
                u={u} v={v} wu={0.3} wv={0.1} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.2, 0.33, 0.46, 0.59, 0.72, 0.85].map((v, i) => (
          <WinL key={`bldtbl${i}`}
            bx={BLD.x} by={BLD.y} bw={BLD.w} bd={BLD.d} bh={BLD.h}
            u={0.04} v={v} wu={0.88} wv={0.02} fill={terra} />
        ))}
      </g>

      {/* ── BTL: tall left tower (sum=10) ───────────────────────────────────── */}
      <g>
        <Box {...BTL} T={twr} R={dgr} L={dgl} />
        {[0.08, 0.21, 0.34, 0.47, 0.60, 0.73, 0.86].map((v, row) =>
          [0.08, 0.54].map((u, col) => {
            const k = `btlr${row}${col}`;
            return (
              <ArchWinR key={k}
                bx={BTL.x} by={BTL.y} bw={BTL.w} bd={BTL.d} bh={BTL.h}
                u={u} v={v} wu={0.3} wv={0.1} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.19, 0.32, 0.45, 0.58, 0.71, 0.84].map((v, i) => (
          <WinR key={`btltb${i}`}
            bx={BTL.x} by={BTL.y} bw={BTL.w} bd={BTL.d} bh={BTL.h}
            u={0.04} v={v} wu={0.88} wv={0.02} fill={terra} />
        ))}
        {[0.08, 0.21, 0.34, 0.47, 0.60, 0.73, 0.86].map((v, row) =>
          [0.08, 0.54].map((u, col) => {
            const k = `btll${row}${col}`;
            return (
              <ArchWinL key={k}
                bx={BTL.x} by={BTL.y} bw={BTL.w} bd={BTL.d} bh={BTL.h}
                u={u} v={v} wu={0.3} wv={0.1} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.19, 0.32, 0.45, 0.58, 0.71, 0.84].map((v, i) => (
          <WinL key={`btltbl${i}`}
            bx={BTL.x} by={BTL.y} bw={BTL.w} bd={BTL.d} bh={BTL.h}
            u={0.04} v={v} wu={0.88} wv={0.02} fill={terra} />
        ))}
      </g>

      {/* ── TOWER (tall dark green, back-right, sum=11) ──────────────────────── */}
      <g>
        <Box {...T} T={twr} R={dgr} L={dgl} />
        {[0.08, 0.22, 0.37, 0.52, 0.67, 0.82].map((v, row) =>
          [0.08, 0.54].map((u, col) => {
            const k = `tr${row}${col}`;
            return (
              <WinR key={k}
                bx={T.x} by={T.y} bw={T.w} bd={T.d} bh={T.h}
                u={u} v={v} wu={0.3} wv={0.11} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((v, i) => (
          <WinR key={`tb${i}`}
            bx={T.x} by={T.y} bw={T.w} bd={T.d} bh={T.h}
            u={0.04} v={v} wu={0.88} wv={0.025} fill={terra} />
        ))}
        {[0.08, 0.22, 0.37, 0.52, 0.67, 0.82].map((v, row) =>
          [0.08, 0.54].map((u, col) => {
            const k = `tl${row}${col}`;
            return (
              <WinL key={k}
                bx={T.x} by={T.y} bw={T.w} bd={T.d} bh={T.h}
                u={u} v={v} wu={0.3} wv={0.11} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((v, i) => (
          <WinL key={`tlb${i}`}
            bx={T.x} by={T.y} bw={T.w} bd={T.d} bh={T.h}
            u={0.04} v={v} wu={0.88} wv={0.025} fill={terra} />
        ))}
      </g>

      {/* ── CENTRAL DARK BUILDING (sum=11) ──────────────────────────────────── */}
      <g>
        <Box {...CN} T={dgt} R={dgr} L={dgl} />
        {[0.12, 0.28, 0.44, 0.6, 0.76].map((v, row) =>
          [0.1, 0.55].map((u, col) => {
            const k = `cnr${row}${col}`;
            return (
              <ArchWinR key={k}
                bx={CN.x} by={CN.y} bw={CN.w} bd={CN.d} bh={CN.h}
                u={u} v={v} wu={0.26} wv={0.13} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.275, 0.435, 0.595, 0.755].map((v, i) => (
          <WinR key={`cnrb${i}`}
            bx={CN.x} by={CN.y} bw={CN.w} bd={CN.d} bh={CN.h}
            u={0.06} v={v} wu={0.82} wv={0.02} fill={terra} />
        ))}
        {[0.12, 0.28, 0.44, 0.6, 0.76].map((v, row) =>
          [0.1, 0.55].map((u, col) => {
            const k = `cnl${row}${col}`;
            return (
              <ArchWinL key={k}
                bx={CN.x} by={CN.y} bw={CN.w} bd={CN.d} bh={CN.h}
                u={u} v={v} wu={0.26} wv={0.13} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.275, 0.435, 0.595, 0.755].map((v, i) => (
          <WinL key={`cnlb${i}`}
            bx={CN.x} by={CN.y} bw={CN.w} bd={CN.d} bh={CN.h}
            u={0.06} v={v} wu={0.82} wv={0.02} fill={terra} />
        ))}
      </g>

      {/* ── BBR: bridge building, center-left foreground (sum=12) ────────────── */}
      <g>
        <Box {...BBR} T={dgt} R={dgr} L={dgl} />
        {[0.15, 0.35, 0.55, 0.75].map((v, row) =>
          [0.1, 0.55].map((u, col) => {
            const k = `bbrr${row}${col}`;
            return (
              <WinR key={k}
                bx={BBR.x} by={BBR.y} bw={BBR.w} bd={BBR.d} bh={BBR.h}
                u={u} v={v} wu={0.28} wv={0.15} fill={wf(WIN_LT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.15, 0.35, 0.55, 0.75].map((v, row) =>
          [0.1, 0.55].map((u, col) => {
            const k = `bbrl${row}${col}`;
            return (
              <WinL key={k}
                bx={BBR.x} by={BBR.y} bw={BBR.w} bd={BBR.d} bh={BBR.h}
                u={u} v={v} wu={0.28} wv={0.15} fill={wf(WIN_DK, k)} filter={gf(k)} />
            );
          })
        )}
      </g>

      {/* ── SMALL MINT BUILDING (front-right, sum=13.5) ──────────────────────── */}
      <g>
        <Box {...SM} T={terra} R={mr} L={ml} />
        {[0.15, 0.48, 0.72].map((v, row) =>
          [0.1, 0.55].map((u, col) => {
            const k = `smr${row}${col}`;
            return (
              <WinR key={k}
                bx={SM.x} by={SM.y} bw={SM.w} bd={SM.d} bh={SM.h}
                u={u} v={v} wu={0.28} wv={0.18} fill={wf(MT, k)} filter={gf(k)} />
            );
          })
        )}
        {[0.15, 0.48, 0.72].map((v, row) =>
          [0.12, 0.55].map((u, col) => {
            const k = `sml${row}${col}`;
            return (
              <WinL key={k}
                bx={SM.x} by={SM.y} bw={SM.w} bd={SM.d} bh={SM.h}
                u={u} v={v} wu={0.28} wv={0.18} fill={wf(WIN_ML, k)} filter={gf(k)} />
            );
          })
        )}
        <WinL bx={SM.x} by={SM.y} bw={SM.w} bd={SM.d} bh={SM.h}
              u={0.3} v={0} wu={0.22} wv={0.14} fill={terra_d} />
      </g>
    </svg>
  );
}

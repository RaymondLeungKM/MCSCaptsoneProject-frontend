"use client";

/**
 * Cartoon Characters — 3D-style SVG mascots for the children UI.
 * All characters are built with SVG radial/linear gradients for a
 * CoComelon / Dora-style rounded 3D look. No external images needed.
 */

import { cn } from "@/lib/utils";

type MascotAnimation = "bounce" | "float" | "wiggle" | "scene" | "none";

function getRootAnimationStyle(
  animate: MascotAnimation,
  animations: Record<Exclude<MascotAnimation, "none">, string>,
): React.CSSProperties {
  return animate === "none" ? {} : { animation: animations[animate] };
}

// ─── CSS Keyframes injected once via a hidden element ──────────────────────
// We define the animations here so they're available whenever a character is used.

export function CartoonKeyframes() {
  return (
    <style>{`
      @keyframes cartoon-bounce {
        0%, 100% { transform: translateY(0) scaleY(1); }
        40%       { transform: translateY(-18%) scaleY(1.05); }
        60%       { transform: translateY(-12%) scaleY(1.02); }
      }
      @keyframes cartoon-float {
        0%, 100% { transform: translateY(0px) rotate(-3deg); }
        50%       { transform: translateY(-10px) rotate(3deg); }
      }
      @keyframes cartoon-wiggle {
        0%, 100% { transform: rotate(-4deg); }
        50%       { transform: rotate(4deg); }
      }
      @keyframes cartoon-spin-slow {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes cartoon-twinkle {
        0%, 100% { opacity: 0.2; transform: scale(0.8); }
        50%       { opacity: 1;   transform: scale(1.2); }
      }
      @keyframes cartoon-orbit {
        from { transform: rotate(0deg) translateX(var(--orbit-r, 90px)) rotate(0deg); }
        to   { transform: rotate(360deg) translateX(var(--orbit-r, 90px)) rotate(-360deg); }
      }
      @keyframes cartoon-pulse-glow {
        0%, 100% { filter: drop-shadow(0 0 6px rgba(167,139,250,0.7)); }
        50%       { filter: drop-shadow(0 0 18px rgba(167,139,250,1)); }
      }
      @keyframes cartoon-owl-hover {
        0%, 100% { transform: translateY(0px) rotate(-2deg); }
        35% { transform: translateY(-8px) rotate(1deg); }
        65% { transform: translateY(-12px) rotate(4deg); }
      }
      @keyframes cartoon-wing-flap-left {
        0%, 100% { transform: rotate(-30deg) translateY(0px); }
        35% { transform: rotate(-42deg) translateY(-4px); }
        65% { transform: rotate(-18deg) translateY(2px); }
      }
      @keyframes cartoon-wing-flap-right {
        0%, 100% { transform: rotate(30deg) translateY(0px); }
        35% { transform: rotate(42deg) translateY(-4px); }
        65% { transform: rotate(18deg) translateY(2px); }
      }
      @keyframes cartoon-head-tilt {
        0%, 100% { transform: rotate(-2deg) translateY(0px); }
        50% { transform: rotate(4deg) translateY(-2px); }
      }
      @keyframes cartoon-blink {
        0%, 2%, 60%, 100% { transform: scaleY(1); }
        1%, 1.6% { transform: scaleY(0.12); }
        61%, 61.6% { transform: scaleY(0.18); }
      }
      @keyframes cartoon-pupil-look {
        0%, 100% { transform: translateX(0px) translateY(0px); }
        22% { transform: translateX(2px) translateY(0px); }
        48% { transform: translateX(-2px) translateY(1px); }
        78% { transform: translateX(1px) translateY(-1px); }
      }
      @keyframes cartoon-dog-prance {
        0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
        50% { transform: translateY(-10px) rotate(1.5deg); }
      }
      @keyframes cartoon-ear-flop-left {
        0%, 100% { transform: rotate(-20deg); }
        50% { transform: rotate(-4deg) translateY(3px); }
      }
      @keyframes cartoon-ear-flop-right {
        0%, 100% { transform: rotate(20deg); }
        50% { transform: rotate(4deg) translateY(3px); }
      }
      @keyframes cartoon-tail-wag {
        0%, 100% { transform: rotate(12deg); }
        50% { transform: rotate(-18deg) translateX(2px); }
      }
      @keyframes cartoon-paw-bounce {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
      }
      @keyframes cartoon-cat-prowl {
        0%, 100% { transform: translateY(0px) rotate(1.5deg); }
        50% { transform: translateY(-8px) rotate(-1.5deg); }
      }
      @keyframes cartoon-cat-tail-swish {
        0%, 100% { transform: rotate(10deg); }
        35% { transform: rotate(28deg) translateY(-2px); }
        70% { transform: rotate(-10deg) translateY(2px); }
      }
      @keyframes cartoon-ear-twitch-left {
        0%, 88%, 100% { transform: rotate(0deg); }
        92% { transform: rotate(-10deg); }
        96% { transform: rotate(6deg); }
      }
      @keyframes cartoon-ear-twitch-right {
        0%, 88%, 100% { transform: rotate(0deg); }
        92% { transform: rotate(10deg); }
        96% { transform: rotate(-6deg); }
      }
      @keyframes cartoon-whisker-twitch {
        0%, 100% { transform: translateX(0px); }
        50% { transform: translateX(2px); }
      }
      @keyframes cartoon-body-breath {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02, 0.99); }
      }
      @keyframes dots-pulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40%            { opacity: 1;   transform: scale(1.2); }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-cartoon-motion="true"] {
          animation: none !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

// ─── CartoonOwl ────────────────────────────────────────────────────────────

interface CartoonOwlProps {
  className?: string;
  /** px size for width/height (default 120) */
  size?: number;
  /** Animation variant */
  animate?: MascotAnimation;
}

export function CartoonOwl({ className, size = 120, animate = "float" }: CartoonOwlProps) {
  const isScene = animate === "scene";
  const shouldAnimate = animate !== "none";
  const animStyle = getRootAnimationStyle(animate, {
    bounce: "cartoon-bounce 1.2s ease-in-out infinite",
    float: "cartoon-float 3s ease-in-out infinite",
    wiggle: "cartoon-wiggle 1.5s ease-in-out infinite",
    scene: "cartoon-owl-hover 4.2s ease-in-out infinite",
  });
  const bodyStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-body-breath 3.4s ease-in-out infinite", transformOrigin: "100px 140px" }
    : undefined;
  const headStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-head-tilt 3.7s ease-in-out infinite", transformOrigin: "100px 82px" }
    : undefined;
  const leftWingStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-wing-flap-left 2.4s ease-in-out infinite", transformOrigin: "70px 128px" }
    : undefined;
  const rightWingStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-wing-flap-right 2.4s ease-in-out infinite", transformOrigin: "130px 128px" }
    : undefined;
  const leftEarStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-ear-twitch-left 5.4s ease-in-out infinite", transformOrigin: "72px 34px" }
    : undefined;
  const rightEarStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-ear-twitch-right 5.4s ease-in-out infinite", transformOrigin: "128px 34px" }
    : undefined;
  const leftBlinkStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-blink 5.8s ease-in-out infinite", transformOrigin: "78px 82px" }
    : undefined;
  const rightBlinkStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-blink 5.8s ease-in-out infinite", transformOrigin: "122px 82px" }
    : undefined;
  const leftLookStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-pupil-look 6.4s ease-in-out infinite", transformOrigin: "78px 84px" }
    : undefined;
  const rightLookStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-pupil-look 6.4s ease-in-out infinite reverse", transformOrigin: "122px 84px" }
    : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      style={animStyle}
      data-cartoon-motion={shouldAnimate ? "true" : undefined}
      aria-hidden="true"
    >
      <defs>
        {/* Body shading — radial for 3D sphere effect */}
        <radialGradient id="owl-body-grad" cx="38%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        {/* Head */}
        <radialGradient id="owl-head-grad" cx="40%" cy="30%" r="58%">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        {/* Belly patch */}
        <radialGradient id="owl-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#fed7aa" />
        </radialGradient>
        {/* Wing gradient */}
        <linearGradient id="owl-wing-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        {/* Specular highlight */}
        <radialGradient id="owl-spec" cx="35%" cy="25%" r="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Iris */}
        <radialGradient id="owl-iris-l" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
        <radialGradient id="owl-iris-r" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
      </defs>

      {/* ── WINGS ── */}
      <g data-cartoon-motion={isScene ? "true" : undefined} style={leftWingStyle}>
        <ellipse cx="42" cy="130" rx="28" ry="16" fill="url(#owl-wing-grad)" transform="rotate(-30 42 130)" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={rightWingStyle}>
        <ellipse cx="158" cy="130" rx="28" ry="16" fill="url(#owl-wing-grad)" transform="rotate(30 158 130)" />
      </g>

      {/* ── BODY ── */}
      <g data-cartoon-motion={isScene ? "true" : undefined} style={bodyStyle}>
        <ellipse cx="100" cy="138" rx="52" ry="55" fill="url(#owl-body-grad)" />
        <ellipse cx="100" cy="138" rx="52" ry="55" fill="url(#owl-spec)" />
        <ellipse cx="100" cy="148" rx="32" ry="36" fill="url(#owl-belly-grad)" />
      </g>

      {/* ── HEAD ── */}
      <g data-cartoon-motion={isScene ? "true" : undefined} style={headStyle}>
        <circle cx="100" cy="80" r="52" fill="url(#owl-head-grad)" />
        <ellipse cx="82" cy="60" rx="20" ry="14" fill="white" fillOpacity="0.3" />

        <g data-cartoon-motion={isScene ? "true" : undefined} style={leftEarStyle}>
          <ellipse cx="72" cy="34" rx="11" ry="18" fill="#7c3aed" transform="rotate(-15 72 34)" />
          <ellipse cx="72" cy="30" rx="6" ry="11" fill="#d8b4fe" transform="rotate(-15 72 30)" />
        </g>
        <g data-cartoon-motion={isScene ? "true" : undefined} style={rightEarStyle}>
          <ellipse cx="128" cy="34" rx="11" ry="18" fill="#7c3aed" transform="rotate(15 128 34)" />
          <ellipse cx="128" cy="30" rx="6" ry="11" fill="#d8b4fe" transform="rotate(15 128 30)" />
        </g>

        <g data-cartoon-motion={isScene ? "true" : undefined} style={leftBlinkStyle}>
          <ellipse cx="78" cy="82" rx="22" ry="24" fill="white" />
          <g data-cartoon-motion={isScene ? "true" : undefined} style={leftLookStyle}>
            <circle cx="78" cy="84" r="14" fill="url(#owl-iris-l)" />
            <circle cx="80" cy="85" r="8" fill="#0f172a" />
            <circle cx="84" cy="80" r="3.5" fill="white" />
            <circle cx="76" cy="88" r="1.5" fill="white" fillOpacity="0.6" />
          </g>
        </g>
        <g data-cartoon-motion={isScene ? "true" : undefined} style={rightBlinkStyle}>
          <ellipse cx="122" cy="82" rx="22" ry="24" fill="white" />
          <g data-cartoon-motion={isScene ? "true" : undefined} style={rightLookStyle}>
            <circle cx="122" cy="84" r="14" fill="url(#owl-iris-r)" />
            <circle cx="124" cy="85" r="8" fill="#0f172a" />
            <circle cx="128" cy="80" r="3.5" fill="white" />
            <circle cx="120" cy="88" r="1.5" fill="white" fillOpacity="0.6" />
          </g>
        </g>

        <ellipse cx="100" cy="100" rx="11" ry="8" fill="#fb923c" />
        <ellipse cx="100" cy="99" rx="9" ry="5" fill="#fdba74" />
      </g>

      {/* ── FEET ── */}
      <ellipse cx="83" cy="189" rx="13" ry="6" fill="#fb923c" transform="rotate(-10 83 189)" />
      <ellipse cx="117" cy="189" rx="13" ry="6" fill="#fb923c" transform="rotate(10 117 189)" />
      <ellipse cx="83" cy="187" rx="10" ry="4" fill="#fdba74" transform="rotate(-10 83 187)" />
      <ellipse cx="117" cy="187" rx="10" ry="4" fill="#fdba74" transform="rotate(10 117 187)" />
    </svg>
  );
}

interface CartoonDogProps {
  className?: string;
  size?: number;
  animate?: MascotAnimation;
}

export function CartoonDog({ className, size = 120, animate = "float" }: CartoonDogProps) {
  const isScene = animate === "scene";
  const shouldAnimate = animate !== "none";
  const animStyle = getRootAnimationStyle(animate, {
    bounce: "cartoon-bounce 1.2s ease-in-out infinite",
    float: "cartoon-float 3.2s ease-in-out infinite",
    wiggle: "cartoon-wiggle 1.5s ease-in-out infinite",
    scene: "cartoon-dog-prance 3.4s ease-in-out infinite",
  });
  const bodyStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-body-breath 3.2s ease-in-out infinite", transformOrigin: "100px 142px" }
    : undefined;
  const headStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-head-tilt 3.1s ease-in-out infinite", transformOrigin: "100px 86px" }
    : undefined;
  const leftEarStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-ear-flop-left 1.9s ease-in-out infinite", transformOrigin: "52px 82px" }
    : undefined;
  const rightEarStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-ear-flop-right 1.9s ease-in-out infinite", transformOrigin: "148px 82px" }
    : undefined;
  const leftBlinkStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-blink 5.1s ease-in-out infinite", transformOrigin: "79px 84px" }
    : undefined;
  const rightBlinkStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-blink 5.1s ease-in-out infinite", transformOrigin: "121px 84px" }
    : undefined;
  const tailStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-tail-wag 1.5s ease-in-out infinite", transformOrigin: "151px 144px" }
    : undefined;
  const leftPawStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-paw-bounce 1.4s ease-in-out infinite", transformOrigin: "65px 132px" }
    : undefined;
  const rightPawStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-paw-bounce 1.4s ease-in-out infinite reverse", transformOrigin: "135px 132px" }
    : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      style={animStyle}
      data-cartoon-motion={shouldAnimate ? "true" : undefined}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dog-head-grad" cx="38%" cy="28%" r="62%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="dog-body-grad" cx="36%" cy="30%" r="64%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
        <radialGradient id="dog-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#fed7aa" />
        </radialGradient>
      </defs>

      <g data-cartoon-motion={isScene ? "true" : undefined} style={bodyStyle}>
        <ellipse cx="100" cy="142" rx="50" ry="50" fill="url(#dog-body-grad)" />
        <ellipse cx="100" cy="149" rx="28" ry="31" fill="url(#dog-belly-grad)" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={headStyle}>
        <g data-cartoon-motion={isScene ? "true" : undefined} style={leftEarStyle}>
          <ellipse cx="52" cy="82" rx="18" ry="32" fill="#92400e" transform="rotate(-20 52 82)" />
        </g>
        <g data-cartoon-motion={isScene ? "true" : undefined} style={rightEarStyle}>
          <ellipse cx="148" cy="82" rx="18" ry="32" fill="#92400e" transform="rotate(20 148 82)" />
        </g>
        <circle cx="100" cy="84" r="50" fill="url(#dog-head-grad)" />
        <ellipse cx="80" cy="62" rx="18" ry="12" fill="white" fillOpacity="0.2" />
        <g data-cartoon-motion={isScene ? "true" : undefined} style={leftBlinkStyle}>
          <ellipse cx="79" cy="84" rx="22" ry="24" fill="white" />
          <circle cx="80" cy="86" r="13" fill="#2563eb" />
          <circle cx="82" cy="87" r="7.5" fill="#0f172a" />
          <circle cx="85" cy="82" r="3" fill="white" />
        </g>
        <g data-cartoon-motion={isScene ? "true" : undefined} style={rightBlinkStyle}>
          <ellipse cx="121" cy="84" rx="22" ry="24" fill="white" />
          <circle cx="122" cy="86" r="13" fill="#2563eb" />
          <circle cx="124" cy="87" r="7.5" fill="#0f172a" />
          <circle cx="127" cy="82" r="3" fill="white" />
        </g>
        <ellipse cx="100" cy="108" rx="18" ry="14" fill="#fff7ed" />
        <ellipse cx="100" cy="100" rx="9" ry="7" fill="#1f2937" />
        <path d="M90 116 Q100 126 110 116" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={leftPawStyle}>
        <ellipse cx="65" cy="132" rx="15" ry="11" fill="#c2410c" transform="rotate(-28 65 132)" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={rightPawStyle}>
        <ellipse cx="135" cy="132" rx="15" ry="11" fill="#c2410c" transform="rotate(28 135 132)" />
      </g>
      <ellipse cx="84" cy="189" rx="12" ry="6" fill="#fb923c" transform="rotate(-8 84 189)" />
      <ellipse cx="116" cy="189" rx="12" ry="6" fill="#fb923c" transform="rotate(8 116 189)" />
      <g data-cartoon-motion={isScene ? "true" : undefined} style={tailStyle}>
        <path d="M151 144 Q178 132 168 104" stroke="#92400e" strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

interface CartoonCatProps {
  className?: string;
  size?: number;
  animate?: MascotAnimation;
}

export function CartoonCat({ className, size = 120, animate = "float" }: CartoonCatProps) {
  const isScene = animate === "scene";
  const shouldAnimate = animate !== "none";
  const animStyle = getRootAnimationStyle(animate, {
    bounce: "cartoon-bounce 1.2s ease-in-out infinite",
    float: "cartoon-float 3s ease-in-out infinite",
    wiggle: "cartoon-wiggle 1.5s ease-in-out infinite",
    scene: "cartoon-cat-prowl 4.1s ease-in-out infinite",
  });
  const bodyStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-body-breath 3.6s ease-in-out infinite", transformOrigin: "100px 144px" }
    : undefined;
  const leftEarStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-ear-twitch-left 4.8s ease-in-out infinite", transformOrigin: "78px 46px" }
    : undefined;
  const rightEarStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-ear-twitch-right 4.8s ease-in-out infinite", transformOrigin: "122px 46px" }
    : undefined;
  const leftBlinkStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-blink 5.4s ease-in-out infinite", transformOrigin: "79px 84px" }
    : undefined;
  const rightBlinkStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-blink 5.4s ease-in-out infinite", transformOrigin: "121px 84px" }
    : undefined;
  const leftWhiskerStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-whisker-twitch 2.8s ease-in-out infinite", transformOrigin: "89px 109px" }
    : undefined;
  const rightWhiskerStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-whisker-twitch 2.8s ease-in-out infinite reverse", transformOrigin: "111px 109px" }
    : undefined;
  const tailStyle: React.CSSProperties | undefined = isScene
    ? { animation: "cartoon-cat-tail-swish 2.4s ease-in-out infinite", transformOrigin: "144px 152px" }
    : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      style={animStyle}
      data-cartoon-motion={shouldAnimate ? "true" : undefined}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="cat-head-grad" cx="38%" cy="28%" r="62%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <radialGradient id="cat-body-grad" cx="35%" cy="30%" r="62%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
        <radialGradient id="cat-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#fed7aa" />
        </radialGradient>
      </defs>

      <g data-cartoon-motion={isScene ? "true" : undefined} style={bodyStyle}>
        <ellipse cx="100" cy="144" rx="46" ry="48" fill="url(#cat-body-grad)" />
        <ellipse cx="100" cy="150" rx="24" ry="28" fill="url(#cat-belly-grad)" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={leftEarStyle}>
        <path d="M62 48 L82 16 L92 49" fill="#f97316" />
        <path d="M68 44 L81 24 L88 45" fill="#fecaca" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={rightEarStyle}>
        <path d="M138 48 L118 16 L108 49" fill="#f97316" />
        <path d="M132 44 L119 24 L112 45" fill="#fecaca" />
      </g>
      <circle cx="100" cy="84" r="48" fill="url(#cat-head-grad)" />
      <ellipse cx="80" cy="61" rx="18" ry="12" fill="white" fillOpacity="0.2" />
      <g data-cartoon-motion={isScene ? "true" : undefined} style={leftBlinkStyle}>
        <ellipse cx="79" cy="84" rx="20" ry="22" fill="white" />
        <circle cx="80" cy="86" r="12" fill="#2563eb" />
        <circle cx="82" cy="87" r="7" fill="#0f172a" />
        <circle cx="84" cy="82" r="2.8" fill="white" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={rightBlinkStyle}>
        <ellipse cx="121" cy="84" rx="20" ry="22" fill="white" />
        <circle cx="122" cy="86" r="12" fill="#2563eb" />
        <circle cx="124" cy="87" r="7" fill="#0f172a" />
        <circle cx="126" cy="82" r="2.8" fill="white" />
      </g>
      <path d="M94 102 L100 109 L106 102" fill="#f9a8d4" />
      <path d="M92 113 Q100 121 108 113" stroke="#7c2d12" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <g data-cartoon-motion={isScene ? "true" : undefined} style={leftWhiskerStyle}>
        <path d="M89 106 L67 102" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M89 111 L65 112" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g data-cartoon-motion={isScene ? "true" : undefined} style={rightWhiskerStyle}>
        <path d="M111 106 L133 102" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M111 111 L135 112" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path d="M66 67 Q55 75 61 90" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M134 67 Q145 75 139 90" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" fill="none" />
      <g data-cartoon-motion={isScene ? "true" : undefined} style={tailStyle}>
        <path d="M144 152 Q176 133 164 96" stroke="#9a3412" strokeWidth="8" strokeLinecap="round" fill="none" />
      </g>
      <path d="M70 68 C77 64 82 64 89 68" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
      <path d="M111 68 C118 64 123 64 130 68" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="85" cy="189" rx="11" ry="6" fill="#fb923c" transform="rotate(-8 85 189)" />
      <ellipse cx="115" cy="189" rx="11" ry="6" fill="#fb923c" transform="rotate(8 115 189)" />
    </svg>
  );
}

// ─── CartoonStar ───────────────────────────────────────────────────────────

interface CartoonStarProps {
  className?: string;
  size?: number;
  animate?: "bounce" | "float" | "wiggle" | "spin" | "none";
  style?: React.CSSProperties;
}

export function CartoonStar({
  className,
  size = 80,
  animate = "float",
  style,
}: CartoonStarProps) {
  const animStyle: React.CSSProperties =
    animate === "bounce"
      ? { animation: "cartoon-bounce 1s ease-in-out infinite" }
      : animate === "float"
      ? { animation: "cartoon-float 2.5s ease-in-out infinite" }
      : animate === "wiggle"
      ? { animation: "cartoon-wiggle 1.2s ease-in-out infinite" }
      : animate === "spin"
      ? { animation: "cartoon-spin-slow 6s linear infinite" }
      : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      style={{ ...animStyle, ...style }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="star-body-grad" cx="38%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="star-spec" cx="32%" cy="25%" r="35%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Star shape (5-point, plump) ── */}
      <path
        d="M80 10 L93 55 L140 55 L104 82 L118 128 L80 102 L42 128 L56 82 L20 55 L67 55 Z"
        fill="url(#star-body-grad)"
        stroke="#d97706"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Specular highlight */}
      <path
        d="M80 10 L93 55 L140 55 L104 82 L118 128 L80 102 L42 128 L56 82 L20 55 L67 55 Z"
        fill="url(#star-spec)"
      />

      {/* ── Eyes ── */}
      <ellipse cx="67" cy="72" rx="10" ry="11" fill="white" />
      <ellipse cx="93" cy="72" rx="10" ry="11" fill="white" />
      <circle cx="68" cy="73" r="6" fill="#1e3a5f" />
      <circle cx="94" cy="73" r="6" fill="#1e3a5f" />
      {/* pupils */}
      <circle cx="69" cy="74" r="3.5" fill="#0f172a" />
      <circle cx="95" cy="74" r="3.5" fill="#0f172a" />
      {/* glints */}
      <circle cx="72" cy="70" r="2.5" fill="white" />
      <circle cx="98" cy="70" r="2.5" fill="white" />

      {/* ── Smile ── */}
      <path d="M70 86 Q80 94 90 86" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* ── Cheek blush ── */}
      <ellipse cx="55" cy="82" rx="7" ry="4" fill="#fca5a5" fillOpacity="0.5" />
      <ellipse cx="105" cy="82" rx="7" ry="4" fill="#fca5a5" fillOpacity="0.5" />
    </svg>
  );
}

// ─── CartoonBook ───────────────────────────────────────────────────────────

interface CartoonBookProps {
  className?: string;
  size?: number;
  animate?: "bounce" | "float" | "wiggle" | "none";
}

export function CartoonBook({ className, size = 80, animate = "wiggle" }: CartoonBookProps) {
  const animStyle: React.CSSProperties =
    animate === "bounce"
      ? { animation: "cartoon-bounce 1.2s ease-in-out infinite" }
      : animate === "float"
      ? { animation: "cartoon-float 3s ease-in-out infinite" }
      : animate === "wiggle"
      ? { animation: "cartoon-wiggle 2s ease-in-out infinite" }
      : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      style={animStyle}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="book-cover-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="book-cover-r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <radialGradient id="book-spec" cx="30%" cy="20%" r="40%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Left cover ── */}
      <path d="M20 30 Q18 28 18 30 L18 135 Q18 138 22 138 L80 130 L80 25 Z" fill="url(#book-cover-l)" />
      {/* ── Right cover ── */}
      <path d="M140 30 Q142 28 142 30 L142 135 Q142 138 138 138 L80 130 L80 25 Z" fill="url(#book-cover-r)" />
      {/* ── Spine ── */}
      <rect x="76" y="24" width="8" height="107" rx="3" fill="#7f1d1d" />
      {/* ── Pages (right side) ── */}
      <path d="M80 26 L136 32 L136 132 L80 130 Z" fill="#fef9c3" />
      {/* ── Lines on pages ── */}
      <line x1="90" y1="55" x2="128" y2="57" stroke="#d1d5db" strokeWidth="2" />
      <line x1="90" y1="68" x2="128" y2="70" stroke="#d1d5db" strokeWidth="2" />
      <line x1="90" y1="81" x2="128" y2="83" stroke="#d1d5db" strokeWidth="2" />
      <line x1="90" y1="94" x2="128" y2="96" stroke="#d1d5db" strokeWidth="2" />
      {/* Specular */}
      <path d="M20 30 Q18 28 18 30 L18 135 Q18 138 22 138 L80 130 L80 25 Z" fill="url(#book-spec)" />

      {/* ── Face on left cover ── */}
      <ellipse cx="46" cy="84" rx="14" ry="15" fill="white" fillOpacity="0.9" />
      {/* eyes */}
      <ellipse cx="40" cy="80" rx="5" ry="5.5" fill="white" />
      <ellipse cx="52" cy="80" rx="5" ry="5.5" fill="white" />
      <circle cx="40" cy="80" r="3" fill="#1e293b" />
      <circle cx="52" cy="80" r="3" fill="#1e293b" />
      <circle cx="41.5" cy="78.5" r="1.5" fill="white" />
      <circle cx="53.5" cy="78.5" r="1.5" fill="white" />
      {/* smile */}
      <path d="M37 89 Q46 95 55 89" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* ── Sparkles flying out ── */}
      <circle cx="110" cy="20" r="4" fill="#fbbf24" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="128" cy="14" r="3" fill="#34d399" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="145" cy="22" r="2.5" fill="#f472b6" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ─── TwinkleStar (tiny decorative particle) ───────────────────────────────

interface TwinkleStarProps {
  className?: string;
  size?: number;
  color?: string;
  delay?: string;
  style?: React.CSSProperties;
}

export function TwinkleStar({
  className,
  size = 14,
  color = "white",
  delay = "0s",
  style,
}: TwinkleStarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      style={{ animation: `cartoon-twinkle 2s ease-in-out infinite ${delay}`, ...style }}
      aria-hidden="true"
    >
      <path
        d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5 Z"
        fill={color}
      />
    </svg>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartoonKeyframes, CartoonOwl } from "@/components/child/cartoon-characters";

interface WrapperProps {
  children: React.ReactNode;
  type?: "center" | "dashboard";
  hideThemeToggle?: boolean;
  hideFloatingStar?: boolean;
}

// --- SVG COMPONENTS ---

const Tulip = ({ className, color = "#FF69B4" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 100 L50 60" stroke="#4CAF50" strokeWidth="4" fill="none" />
    <path d="M50 90 Q30 70 30 50" stroke="#4CAF50" strokeWidth="4" fill="none" />
    <path d="M50 90 Q70 70 70 50" stroke="#4CAF50" strokeWidth="4" fill="none" />
    <path d="M35 30 Q35 60 50 70 Q65 60 65 30 Q50 40 35 30" fill={color} />
    <path d="M35 30 Q42 10 50 35 Q58 10 65 30" fill={color} />
  </svg>
);

const Daisy = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 100 L50 60" stroke="#4CAF50" strokeWidth="3" />
    <g fill="white">
      <ellipse cx="50" cy="50" rx="10" ry="25" transform="rotate(0 50 50)" />
      <ellipse cx="50" cy="50" rx="10" ry="25" transform="rotate(45 50 50)" />
      <ellipse cx="50" cy="50" rx="10" ry="25" transform="rotate(90 50 50)" />
      <ellipse cx="50" cy="50" rx="10" ry="25" transform="rotate(135 50 50)" />
    </g>
    <circle cx="50" cy="50" r="8" fill="#FFD700" />
  </svg>
);

const GrassTuft = ({ className, color="#81C784" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 100 Q40 60 20 50" stroke={color} strokeWidth="4" fill="none" />
    <path d="M50 100 Q50 50 50 30" stroke={color} strokeWidth="4" fill="none" />
    <path d="M50 100 Q60 60 80 50" stroke={color} strokeWidth="4" fill="none" />
  </svg>
);

// New Custom Cloud Component to handle different shapes
const CustomCloud = ({ path, className }: { path: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d={path} fill="currentColor" />
  </svg>
);

// 3 Different Fluffy Cloud Paths for variety
const CLOUD_PATHS = [
  "M18.42 9.21a5.34 5.34 0 0 0-1.89-3.26A5.3 5.3 0 0 0 12.3 4a5.33 5.33 0 0 0-4.66 2.76 4.3 4.3 0 0 0-4.52 4.19A4.18 4.18 0 0 0 5.4 15h13a4.2 4.2 0 0 0 4.2-4.2 4.22 4.22 0 0 0-4.18-1.59z",
  "M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-3.037,2.463-5.5,5.5-5.5c3.037,0,5.5,2.463,5.5,5.5C23,16.537,20.537,19,17.5,19z M6.5,19 C3.463,19,1,16.537,1,13.5C1,10.463,3.463,8,6.5,8c3.037,0,5.5,2.463,5.5,5.5C12,16.537,9.537,19,6.5,19z M12,16 c-2.209,0-4-1.791-4-4c0-2.209,1.791-4,4-4s4,1.791,4,4C16,14.209,14.209,16,12,16z",
  "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
];

// --- STATIC DATA ---

// Star Map
const STAR_POSITIONS = [
  { top: '5%', left: '5%', size: 'w-4 h-4', delay: '0s' },
  { top: '8%', left: '20%', size: 'w-3 h-3', delay: '1s' },
  { top: '15%', left: '35%', size: 'w-5 h-5', delay: '0.5s' },
  { top: '5%', left: '50%', size: 'w-4 h-4', delay: '2s' },
  { top: '12%', left: '65%', size: 'w-3 h-3', delay: '1.5s' },
  { top: '6%', left: '80%', size: 'w-4 h-4', delay: '0.2s' },
  { top: '20%', left: '92%', size: 'w-5 h-5', delay: '2.5s' },
  { top: '25%', left: '10%', size: 'w-3 h-3', delay: '0.8s' },
  { top: '30%', left: '25%', size: 'w-4 h-4', delay: '1.2s' },
  { top: '22%', left: '42%', size: 'w-3 h-3', delay: '3s' },
  { top: '35%', left: '60%', size: 'w-5 h-5', delay: '0.5s' },
  { top: '28%', left: '75%', size: 'w-3 h-3', delay: '2s' },
  { top: '40%', left: '88%', size: 'w-4 h-4', delay: '1s' },
  { top: '45%', left: '5%', size: 'w-3 h-3', delay: '4s' },
  { top: '50%', left: '30%', size: 'w-4 h-4', delay: '2.2s' },
  { top: '10%', left: '95%', size: 'w-3 h-3', delay: '1.8s' },
  { top: '18%', left: '55%', size: 'w-2 h-2', delay: '0.5s' },
  { top: '38%', left: '48%', size: 'w-3 h-3', delay: '3.2s' },
];

// Flower Bed
const FLOWER_BED = [
  { type: 2, left: '1%', bottom: '15px', scale: 0.9, delay: '0s' },
  { type: 0, left: '4%', bottom: '5px', scale: 1.1, delay: '-1s' },
  { type: 1, left: '7%', bottom: '25px', scale: 0.7, delay: '-2s' },
  { type: 2, left: '10%', bottom: '10px', scale: 1.0, delay: '-0.5s' },
  { type: 0, left: '13%', bottom: '30px', scale: 0.6, delay: '-1.5s' },
  { type: 1, left: '16%', bottom: '5px', scale: 1.2, delay: '-2.5s' },
  { type: 2, left: '19%', bottom: '18px', scale: 0.9, delay: '-1s' },
  { type: 0, left: '22%', bottom: '2px', scale: 1.1, delay: '-3s' },
  { type: 1, left: '25%', bottom: '20px', scale: 0.8, delay: '-0.2s' },
  { type: 2, left: '28%', bottom: '8px', scale: 1.0, delay: '-1.8s' },
  { type: 0, left: '31%', bottom: '28px', scale: 0.7, delay: '-2.2s' },
  { type: 1, left: '34%', bottom: '12px', scale: 0.9, delay: '-0.8s' },
  { type: 2, left: '37%', bottom: '5px', scale: 1.1, delay: '-1.2s' },
  { type: 0, left: '40%', bottom: '22px', scale: 0.8, delay: '-2.8s' },
  { type: 1, left: '43%', bottom: '0px', scale: 1.2, delay: '-1.5s' },
  { type: 2, left: '46%', bottom: '15px', scale: 0.9, delay: '-0.5s' },
  { type: 0, left: '49%', bottom: '10px', scale: 1.0, delay: '-3.2s' },
  { type: 1, left: '52%', bottom: '25px', scale: 0.7, delay: '-1.9s' },
  { type: 2, left: '55%', bottom: '5px', scale: 1.1, delay: '-0.3s' },
  { type: 0, left: '58%', bottom: '20px', scale: 0.8, delay: '-2.1s' },
  { type: 1, left: '61%', bottom: '8px', scale: 1.0, delay: '-1.4s' },
  { type: 2, left: '64%', bottom: '28px', scale: 0.6, delay: '-0.9s' },
  { type: 0, left: '67%', bottom: '2px', scale: 1.2, delay: '-2.7s' },
  { type: 1, left: '70%', bottom: '15px', scale: 0.9, delay: '-1.1s' },
  { type: 2, left: '73%', bottom: '10px', scale: 1.0, delay: '-3.5s' },
  { type: 0, left: '76%', bottom: '24px', scale: 0.7, delay: '-0.6s' },
  { type: 1, left: '79%', bottom: '5px', scale: 1.1, delay: '-1.7s' },
  { type: 2, left: '82%', bottom: '18px', scale: 0.8, delay: '-2.4s' },
  { type: 0, left: '85%', bottom: '2px', scale: 1.2, delay: '-0.4s' },
  { type: 1, left: '88%', bottom: '26px', scale: 0.6, delay: '-1.3s' },
  { type: 2, left: '91%', bottom: '10px', scale: 1.0, delay: '-2.9s' },
  { type: 0, left: '94%', bottom: '4px', scale: 1.1, delay: '-1.6s' },
  { type: 1, left: '97%', bottom: '20px', scale: 0.8, delay: '-0.2s' },
];

export default function CozyPageWrapper({
  children,
  type = "center",
  hideThemeToggle = false,
  hideFloatingStar = false,
}: WrapperProps) {
  const [isNight, setIsNight] = useState(false);

  void hideFloatingStar;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 18) setIsNight(true);
  }, []);

  const toggleTheme = () => setIsNight(!isNight);

  return (
    <>
      <CartoonKeyframes />
      <style jsx global>{`
        /* --- ANIMATIONS --- */
        
        /* Flowing Clouds Animation */
        @keyframes cloud-flow {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(120vw); }
        }
        /* Different speeds for parallax effect */
        .animate-flow-slow { animation: cloud-flow 60s linear infinite; }
        .animate-flow-medium { animation: cloud-flow 40s linear infinite; }
        .animate-flow-fast { animation: cloud-flow 25s linear infinite; }
        
        /* Negative delays to ensure clouds are scattered on load */
        .delay-0 { animation-delay: 0s; }
        .delay-n10 { animation-delay: -10s; }
        .delay-n20 { animation-delay: -20s; }
        .delay-n30 { animation-delay: -30s; }

        @keyframes sway-right {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(40px); }
        }
        @keyframes sway-left {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-40px); }
        }
        .animate-hill-back { animation: sway-right 20s ease-in-out infinite; }
        .animate-hill-mid { animation: sway-left 15s ease-in-out infinite; }
        .animate-hill-front { animation: sway-right 12s ease-in-out infinite; }

        @keyframes flower-sway {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(5deg); }
        }
        .animate-flower { animation: flower-sway 3s ease-in-out infinite; transform-origin: bottom center; }
      `}</style>

      <div className={cn(
        "min-h-[100dvh] relative overflow-hidden font-zen transition-all duration-[2000ms] ease-in-out",
        isNight 
          ? "bg-gradient-to-b from-[#2b5876] via-[#3a6073] to-[#4e4376]" 
          : "bg-gradient-to-b from-[#FFFDE7] via-[#E3F2FD] to-[#B3E5FC]",
        type === "center" ? "flex items-center justify-center p-4" : "block"
      )}>
        
        {/* Toggle Button (Fixed Z-Index & Pointer) */}
        {!hideThemeToggle && (
          <button 
            onClick={toggleTheme}
            className="fixed top-3 right-3 z-30 bg-white/20 backdrop-blur-md p-2.5 rounded-full border-2 border-white/50 hover:bg-white/40 hover:scale-110 transition-all shadow-lg group md:top-5 md:right-5 cursor-pointer"
          >
            {isNight ? (
              <Sun className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-spin-slow" />
            ) : (
              <Moon className="w-6 h-6 text-indigo-100 fill-indigo-100" />
            )}
          </button>
        )}

        <div className="fixed inset-0 pointer-events-none">
            
            {/* Celestial Body */}
            <div className={cn(
              "absolute top-10 right-10 transition-all duration-[2500ms] transform",
              isNight ? "translate-y-0 rotate-0" : "translate-y-[-20px] rotate-12"
            )}>
              {isNight ? (
                <div className="relative animate-pulse">
                  <Moon className="w-24 h-24 text-yellow-50 fill-yellow-50 drop-shadow-[0_0_30px_rgba(255,255,200,0.4)]" />
                  <span className="absolute -top-2 -right-4 text-white/60 text-2xl font-black animate-bounce delay-700">z</span>
                </div>
              ) : (
                <Sun className="w-32 h-32 text-[#FFD54F] fill-[#FFE082] drop-shadow-lg opacity-100 animate-[spin_25s_linear_infinite]" />
              )}
            </div>

            {/* Stars (Night Only) - Bright Yellow */}
            <div className={cn("absolute inset-0 transition-opacity duration-[2000ms]", isNight ? "opacity-100" : "opacity-0")}>
              {STAR_POSITIONS.map((star, i) => (
                <Star 
                  key={`star-${i}`}
                  // Fixed: Ensuring yellow color
                  className={cn("absolute text-yellow-300 fill-yellow-300 animate-pulse", star.size)}
                  style={{ top: star.top, left: star.left, animationDelay: star.delay }}
                />
              ))}
            </div>

            {/* --- CLOUDS (Improved Visibility & Flow) --- */}
            {/* Note: In Night mode, they become very faint (opacity-10) but still flow. In Day, they are bright (opacity-90/100). */}
            
            {/* Layer 1: Slow, Big, Back */}
            <div className={cn("absolute top-16 -left-32 animate-flow-slow delay-0", isNight ? "opacity-10 text-indigo-200" : "opacity-90 text-white")}>
              <CustomCloud path={CLOUD_PATHS[2]} className="w-48 h-48 drop-shadow-sm" />
            </div>
            
            {/* Layer 2: Slow, Medium, varied height */}
            <div className={cn("absolute top-32 -left-10 animate-flow-slow delay-n20", isNight ? "opacity-10 text-indigo-200" : "opacity-80 text-white")}>
              <CustomCloud path={CLOUD_PATHS[0]} className="w-32 h-32 drop-shadow-sm" />
            </div>
            
            {/* Layer 3: Medium Speed */}
            <div className={cn("absolute top-[20%] -left-20 animate-flow-medium delay-n10", isNight ? "opacity-5 text-indigo-300" : "opacity-70 text-white")}>
              <CustomCloud path={CLOUD_PATHS[1]} className="w-24 h-24" />
            </div>
            
            {/* Layer 4: Medium Speed, lower */}
            <div className={cn("absolute top-[40%] -left-32 animate-flow-medium delay-n30", isNight ? "opacity-5 text-indigo-200" : "opacity-70 text-white")}>
              <CustomCloud path={CLOUD_PATHS[0]} className="w-36 h-36" />
            </div>
            
            {/* Layer 5: Fast, Small, Front */}
            <div className={cn("absolute top-10 -left-10 animate-flow-fast delay-n10", isNight ? "opacity-5 text-indigo-300" : "opacity-60 text-white")}>
              <CustomCloud path={CLOUD_PATHS[0]} className="w-20 h-20" />
            </div>

            {/* ── Cartoon mascots (day only) ── */}
            <div className={cn(
              "absolute transition-all duration-[2000ms]",
              isNight ? "opacity-0 pointer-events-none" : "opacity-100"
            )} style={{ bottom: "18%", right: "3%" }}>
              <CartoonOwl size={88} animate="float" variant="storybook" />
            </div>
            <div className={cn(
              "absolute transition-all duration-[2000ms]",
              isNight ? "opacity-60" : "opacity-0 pointer-events-none"
            )} style={{ bottom: "22%", right: "4%" }}>
              <CartoonOwl size={80} animate="float" variant="storybook" />
            </div>

            {/* --- HILLS & GARDEN --- */}
            <div className="absolute bottom-0 left-0 w-full h-[35vh] overflow-hidden pointer-events-none">
                
                {/* Back Hill */}
                <div className={cn(
                  "absolute bottom-[-100px] left-[-25%] right-[-25%] h-[50vh] rounded-t-[100%] transition-colors duration-[2000ms] animate-hill-back",
                  isNight ? "bg-[#1e3a8a] opacity-80" : "bg-[#81C784] opacity-80"
                )} />

                {/* Middle Hill */}
                <div className={cn(
                  "absolute bottom-[-120px] left-[-20%] right-[-20%] h-[45vh] rounded-t-[100%] transition-colors duration-[2000ms] animate-hill-mid",
                  isNight ? "bg-[#2a4858] opacity-90" : "bg-[#A5D6A7] opacity-90"
                )} />

                {/* Front Hill */}
                <div className={cn(
                  "absolute bottom-[-130px] left-[-10%] right-[-10%] h-[40vh] rounded-t-[100%] transition-colors duration-[2000ms] animate-hill-front",
                  isNight ? "bg-[#355c7d]" : "bg-[#C8E6C9]"
                )} />

                {/* --- FULL FLOWER BED (Restored) --- */}
                {FLOWER_BED.map((flower, i) => (
                  <div 
                    key={i} 
                    className="absolute animate-flower"
                    style={{ 
                        left: flower.left, 
                        bottom: flower.bottom,
                        animationDelay: flower.delay,
                        transform: `scale(${flower.scale})`, 
                        zIndex: Math.floor(flower.scale * 10) 
                    }}
                  >
                    {flower.type === 0 && (
                      <Tulip 
                        color={i % 2 === 0 ? "#FF4081" : "#FFEB3B"} 
                        className={cn("w-12 h-12", isNight && "opacity-60 grayscale-[0.5]")} 
                      />
                    )}
                    {flower.type === 1 && (
                      <Daisy 
                        className={cn("w-10 h-10", isNight && "opacity-60 grayscale-[0.5]")} 
                      />
                    )}
                    {flower.type === 2 && (
                       <GrassTuft 
                         color={isNight ? "#2a4858" : "#66BB6A"}
                         className="w-14 h-14 opacity-80" 
                       />
                    )}
                  </div>
                ))}
            </div>
        </div>

        <div className={cn("relative z-10 w-full", type === "center" ? "max-w-md" : "max-w-2xl md:max-w-6xl mx-auto")}>
          {children}
        </div>
      </div>
    </>
  );
}
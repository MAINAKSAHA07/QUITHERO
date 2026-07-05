import React, { useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface BorderGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  glowSize?: number;
  glowOpacity?: number;
  borderRadius?: string;
  innerClassName?: string;
}

export const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className,
  innerClassName,
  glowColor = "rgba(139, 205, 232, 0.6)",
  glowSize = 150,
  glowOpacity = 0.8,
  borderRadius = "16px",
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: -1000, y: -1000 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden p-[1px]", className)}
      style={{
        borderRadius,
        background: isHovered
          ? `radial-gradient(${glowSize}px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent)`
          : "rgba(180, 220, 235, 0.45)", // Default glass border
        transition: "background 0.25s ease-out",
      }}
      {...props}
    >
      <div
        className={cn("w-full h-full bg-white/72 backdrop-blur-[24px] shadow-[0_8px_32px_rgba(90,130,150,0.08)]", innerClassName)}
        style={{
          borderRadius: `calc(${borderRadius} - 1px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;

import { Card } from "@/components/ui/card";
import { ReactNode, useRef, MouseEvent, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
  style?: CSSProperties;
}

const InteractiveCard = ({ children, className, glowIntensity = 'medium', style }: InteractiveCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    
    // Update corner lights position
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  };

  const glowClasses = {
    low: 'before:opacity-20 after:opacity-20',
    medium: 'before:opacity-30 after:opacity-30', 
    high: 'before:opacity-50 after:opacity-50'
  };

  return (
    <div className="relative group">
      <Card
        ref={cardRef}
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-out",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/20 before:via-transparent before:to-secondary/20 before:opacity-0 before:transition-opacity before:duration-300",
          "after:absolute after:w-32 after:h-32 after:bg-gradient-radial after:from-primary/40 after:to-transparent after:rounded-full after:blur-xl after:opacity-0 after:transition-all after:duration-300",
          "after:left-[var(--mouse-x,-100px)] after:top-[var(--mouse-y,-100px)] after:-translate-x-1/2 after:-translate-y-1/2",
          "hover:before:opacity-100",
          `hover:${glowClasses[glowIntensity]}`,
          "hover:shadow-xl hover:shadow-primary/20",
          // Corner lights
          "corner-lights",
          className
        )}
        style={style}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Corner light effects */}
        <div className="absolute top-0 left-0 w-4 h-4 bg-gradient-to-br from-primary via-primary-glow to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 corner-light-tl" />
        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-secondary via-primary to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 corner-light-tr" />
        <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-tr from-accent via-primary to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 corner-light-bl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-primary-glow via-secondary to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 corner-light-br" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </Card>
    </div>
  );
};

export default InteractiveCard;
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CursorState {
  x: number;
  y: number;
  isHovering: boolean;
  isClicking: boolean;
  cursorType: 'default' | 'pointer' | 'text' | 'button';
}

const CustomCursor = () => {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    isHovering: false,
    isClicking: false,
    cursorType: 'default'
  });

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setCursor(prev => ({
        ...prev,
        x: e.clientX,
        y: e.clientY
      }));
    };

    const handleMouseDown = () => {
      setCursor(prev => ({ ...prev, isClicking: true }));
    };

    const handleMouseUp = () => {
      setCursor(prev => ({ ...prev, isClicking: false }));
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      let cursorType: CursorState['cursorType'] = 'default';
      
      if (target.matches('button, .cursor-pointer, a, [role="button"]')) {
        cursorType = 'button';
      } else if (target.matches('input, textarea, [contenteditable]')) {
        cursorType = 'text';
      } else if (target.matches('.interactive-card, .hover-scale, .hover-lift')) {
        cursorType = 'pointer';
      }

      setCursor(prev => ({ 
        ...prev, 
        isHovering: cursorType !== 'default',
        cursorType 
      }));
    };

    const handleMouseLeave = () => {
      setCursor(prev => ({ 
        ...prev, 
        isHovering: false,
        cursorType: 'default' 
      }));
    };

    // Add event listeners
    document.addEventListener('mousemove', updateCursor);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, textarea, [contenteditable], .cursor-pointer, .interactive-card, .hover-scale, .hover-lift, [role="button"]'
    );
    
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });

      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      {/* Main cursor dot */}
      <div
        className={cn(
          "custom-cursor-dot",
          "fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[9999]",
          "transition-all duration-100 ease-out",
          cursor.isClicking && "scale-75",
          cursor.cursorType === 'button' && "bg-accent scale-125",
          cursor.cursorType === 'text' && "bg-secondary scale-110"
        )}
        style={{
          transform: `translate(${cursor.x - 4}px, ${cursor.y - 4}px)`
        }}
      />
      
      {/* Cursor ring */}
      <div
        className={cn(
          "custom-cursor-ring",
          "fixed top-0 left-0 w-8 h-8 border border-primary/30 rounded-full pointer-events-none z-[9998]",
          "transition-all duration-200 ease-out",
          cursor.isHovering && "scale-150 border-primary/50",
          cursor.isClicking && "scale-75",
          cursor.cursorType === 'button' && "border-accent/50 scale-200",
          cursor.cursorType === 'pointer' && "border-secondary/50 scale-175",
          cursor.cursorType === 'text' && "border-secondary/40 scale-125"
        )}
        style={{
          transform: `translate(${cursor.x - 16}px, ${cursor.y - 16}px)`
        }}
      />

      {/* Glow effect for special interactions */}
      {cursor.cursorType === 'button' && (
        <div
          className="fixed top-0 left-0 w-12 h-12 bg-accent/20 rounded-full pointer-events-none z-[9997] blur-md transition-all duration-300"
          style={{
            transform: `translate(${cursor.x - 24}px, ${cursor.y - 24}px)`
          }}
        />
      )}
    </>
  );
};

export default CustomCursor;
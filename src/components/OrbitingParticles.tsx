import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

const OrbitingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  
  const colors = [
    'rgba(255, 61, 252, 0.7)',  // magenta
    'rgba(0, 238, 255, 0.7)',   // cyan
    'rgba(123, 97, 255, 0.7)',  // purple
    'rgba(255, 102, 0, 0.7)',   // orange
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create particles
    const createParticles = () => {
      const particles: Particle[] = [];
      const particleCount = Math.min(Math.floor(width * height / 15000), 50); // Reduced particle count
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 4 + 1, // Slightly smaller particles
          speedX: (Math.random() - 0.5) * 0.5, // Slower movement
          speedY: (Math.random() - 0.5) * 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.5 + 0.2 // Lower opacity
        });
      }
      
      return particles;
    };
    
    particlesRef.current = createParticles();
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Add a subtle gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(10, 10, 31, 0.03)'); // Reduced opacity
      gradient.addColorStop(1, 'rgba(26, 16, 64, 0.03)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      particlesRef.current.forEach((particle) => {
        // Update particle position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
        
        // Draw particle with glow effect
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10; // Reduced blur
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace('0.7', particle.opacity.toString());
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw connecting lines
        particlesRef.current.forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) { // Reduced connection distance
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            const alpha = 0.03 * (1 - distance / 120); // Reduced opacity
            const gradient = ctx.createLinearGradient(
              particle.x, particle.y, otherParticle.x, otherParticle.y
            );
            gradient.addColorStop(0, particle.color.replace('0.7', (alpha * 0.5).toString()));
            gradient.addColorStop(1, otherParticle.color.replace('0.7', (alpha * 0.5).toString()));
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.7; // Thinner lines
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ position: 'fixed', zIndex: 1 }}
    />
  );
};

export default OrbitingParticles;

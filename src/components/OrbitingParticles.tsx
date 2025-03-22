import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
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
    let mouseX = width / 2;
    let mouseY = height / 2;
    
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    // Track mouse position for interactive particles
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Create particles
    const createParticles = () => {
      const particles: Particle[] = [];
      // Create different groups of particles for diverse movement patterns
      const particleCount = Math.min(Math.floor(width * height / 15000), 60);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 5 + 1, // Varied sizes 
          speedX: (Math.random() - 0.5) * 0.8, // More varied movement speeds
          speedY: (Math.random() - 0.5) * 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.7 + 0.1, 
          pulse: 0,
          pulseSpeed: Math.random() * 0.03 + 0.01
        });
      }
      
      return particles;
    };
    
    particlesRef.current = createParticles();
    
    const animate = () => {
      // Create a semi-transparent overlay to create a trail effect
      ctx.fillStyle = 'rgba(5, 8, 20, 0.2)'; // Matches the background color with transparency
      ctx.fillRect(0, 0, width, height);
      
      particlesRef.current.forEach((particle, index) => {
        // Update pulse value
        particle.pulse += particle.pulseSpeed;
        if (particle.pulse > 1 || particle.pulse < 0) {
          particle.pulseSpeed *= -1;
        }
        
        // Calculate speed adjustments based on mouse position
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Particle movement logic
        if (distance < 200) {
          // Particles close to mouse gently move away
          particle.speedX += -dx * 0.0001;
          particle.speedY += -dy * 0.0001;
        } else {
          // Particles far from mouse move in more complex patterns
          if (index % 3 === 0) { // Circular motion for 1/3 of particles
            particle.speedX = Math.cos(Date.now() * 0.001 + index) * 0.2;
            particle.speedY = Math.sin(Date.now() * 0.001 + index) * 0.2;
          } else if (index % 3 === 1) { // Slight attraction to center
            particle.speedX += (width / 2 - particle.x) * 0.00003;
            particle.speedY += (height / 2 - particle.y) * 0.00003;
          }
          // The remaining 1/3 keep their original random movement
        }
        
        // Apply speed constraints
        particle.speedX = Math.max(-1, Math.min(1, particle.speedX));
        particle.speedY = Math.max(-1, Math.min(1, particle.speedY));
        
        // Update particle position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges with a slight offset for more organic look
        if (particle.x < -50) particle.x = width + 50;
        if (particle.x > width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = height + 50;
        if (particle.y > height + 50) particle.y = -50;
        
        // Calculate size and opacity variations
        const pulseSize = particle.size * (1 + particle.pulse * 0.3);
        const pulseOpacity = particle.opacity * (1 - particle.pulse * 0.3);
        
        // Draw particle with glow effect
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 15; // Enhanced glow
        
        // Create radial gradient for particles
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, pulseSize * 2
        );
        
        const baseColor = particle.color.replace('0.7', pulseOpacity.toString());
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, baseColor.replace(/[^,]+\)/, '0)'));
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw connecting lines between nearby particles
        particlesRef.current.forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) { // Increased connection distance
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            const alpha = 0.1 * (1 - distance / 150); // Adjusted transparency
            const lineGradient = ctx.createLinearGradient(
              particle.x, particle.y, otherParticle.x, otherParticle.y
            );
            lineGradient.addColorStop(0, particle.color.replace('0.7', alpha.toString()));
            lineGradient.addColorStop(1, otherParticle.color.replace('0.7', alpha.toString()));
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 0.8 + (1 - distance / 150) * 0.5; // Dynamic line width
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
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


import React, { useEffect, useRef } from 'react';

interface FloatingImage {
  id: number;
  src: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  pulseSpeed: number;
  pulseDirection: number;
}

const FloatingImages: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<FloatingImage[]>([]);
  const animationRef = useRef<number>();
  
  // List of images to float
  const imageSources = [
    '/lovable-uploads/6dc2c748-8a4c-4979-b6cf-575a7f76d008.png',
    '/lovable-uploads/d9f4ac24-7e6f-49a3-b29f-750112d8b00f.png',
    '/lovable-uploads/8db31726-2c24-42b4-a993-a8c998f3a6a0.png',
    '/lovable-uploads/f4b3bf45-730c-46fa-a07e-29a8a4d0ba2e.png'
  ];

  // Initialize the floating images
  const initializeImages = () => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    const newImages: FloatingImage[] = [];
    
    imageSources.forEach((src, index) => {
      // Create 2 instances of each image for more dynamic movements
      for (let i = 0; i < 2; i++) {
        newImages.push({
          id: index * 2 + i,
          src,
          x: Math.random() * containerWidth,
          y: Math.random() * containerHeight,
          rotation: Math.random() * 360,
          scale: 0.2 + Math.random() * 0.4, // Scale between 0.2 and 0.6
          speedX: (Math.random() - 0.5) * 1.2, // Random speed between -0.6 and 0.6
          speedY: (Math.random() - 0.5) * 1.2,
          rotationSpeed: (Math.random() - 0.5) * 2, // Random rotation speed
          pulseSpeed: 0.005 + Math.random() * 0.01, // Random pulse speed
          pulseDirection: Math.random() > 0.5 ? 1 : -1 // Random pulse direction
        });
      }
    });
    
    imagesRef.current = newImages;
  };

  // Animation function
  const animateImages = () => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Update position, rotation and scale of each image
    imagesRef.current = imagesRef.current.map(image => {
      // Update position
      let newX = image.x + image.speedX;
      let newY = image.y + image.speedY;
      
      // Bounce off edges
      if (newX < -100 || newX > containerWidth) {
        image.speedX = -image.speedX;
        newX = image.x + image.speedX;
      }
      
      if (newY < -100 || newY > containerHeight) {
        image.speedY = -image.speedY;
        newY = image.y + image.speedY;
      }
      
      // Update rotation
      const newRotation = image.rotation + image.rotationSpeed;
      
      // Update scale with pulsing effect
      let newScale = image.scale + (image.pulseSpeed * image.pulseDirection);
      
      // Reverse pulse direction if scale gets too large or small
      let newPulseDirection = image.pulseDirection;
      if (newScale > 0.6) {
        newPulseDirection = -1;
        newScale = 0.6;
      } else if (newScale < 0.2) {
        newPulseDirection = 1;
        newScale = 0.2;
      }
      
      return {
        ...image,
        x: newX,
        y: newY,
        rotation: newRotation,
        scale: newScale,
        pulseDirection: newPulseDirection
      };
    });
    
    // Request next animation frame
    animationRef.current = requestAnimationFrame(animateImages);
  };

  // Setup and cleanup
  useEffect(() => {
    // Initialize images on component mount
    initializeImages();
    
    // Handle window resize
    const handleResize = () => {
      initializeImages();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animateImages);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    >
      {imagesRef.current.map((image) => (
        <div
          key={image.id}
          className="absolute transition-opacity duration-500 filter drop-shadow-lg"
          style={{
            left: `${image.x}px`,
            top: `${image.y}px`,
            transform: `rotate(${image.rotation}deg) scale(${image.scale})`,
            transformOrigin: 'center center',
            opacity: 0.7,
            willChange: 'transform, opacity'
          }}
        >
          <img
            src={image.src}
            alt="Floating element"
            className="w-24 h-24 md:w-32 md:h-32 object-contain"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(123, 97, 255, 0.6))'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingImages;

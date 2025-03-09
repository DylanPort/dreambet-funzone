
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
          scale: 0.5 + Math.random() * 0.3, // Increased scale for better visibility
          speedX: (Math.random() - 0.5) * 1.5, // Slightly faster movement
          speedY: (Math.random() - 0.5) * 1.5,
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
      if (newX <= 0 || newX >= containerWidth) {
        image.speedX = -image.speedX;
        newX = image.x + image.speedX;
      }
      
      if (newY <= 0 || newY >= containerHeight) {
        image.speedY = -image.speedY;
        newY = image.y + image.speedY;
      }
      
      // Update rotation
      const newRotation = image.rotation + image.rotationSpeed;
      
      // Update scale with pulsing effect
      let newScale = image.scale + (image.pulseSpeed * image.pulseDirection);
      
      // Reverse pulse direction if scale gets too large or small
      let newPulseDirection = image.pulseDirection;
      if (newScale > 0.8) {
        newPulseDirection = -1;
        newScale = 0.8;
      } else if (newScale < 0.5) {
        newPulseDirection = 1;
        newScale = 0.5;
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
    
    // Force a re-render to update image positions
    // This is done by directly manipulating the DOM elements
    const imageElements = containerRef.current.querySelectorAll('.floating-image-element');
    imagesRef.current.forEach((image, index) => {
      if (imageElements[index]) {
        const element = imageElements[index] as HTMLElement;
        element.style.left = `${image.x}px`;
        element.style.top = `${image.y}px`;
        element.style.transform = `rotate(${image.rotation}deg) scale(${image.scale})`;
      }
    });
    
    // Request next animation frame
    animationRef.current = requestAnimationFrame(animateImages);
  };

  // Setup and cleanup
  useEffect(() => {
    // Initialize images on component mount
    initializeImages();
    
    // Start animation
    animationRef.current = requestAnimationFrame(animateImages);
    
    // Handle window resize
    const handleResize = () => {
      initializeImages();
    };
    
    window.addEventListener('resize', handleResize);
    
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
      className="absolute inset-0 overflow-hidden pointer-events-none z-10"
      style={{ position: 'absolute', width: '100%', height: '100%' }}
    >
      {imagesRef.current.map((image) => (
        <div
          key={image.id}
          className="absolute floating-image-element transition-transform duration-300"
          style={{
            left: `${image.x}px`,
            top: `${image.y}px`,
            transform: `rotate(${image.rotation}deg) scale(${image.scale})`,
            transformOrigin: 'center center',
            opacity: 0.8,
            willChange: 'transform, opacity',
            zIndex: 5
          }}
        >
          <img
            src={image.src}
            alt={`Floating element ${image.id}`}
            className="w-16 h-16 md:w-24 md:h-24 object-contain"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(123, 97, 255, 0.7))'
            }}
            onError={(e) => {
              console.error(`Failed to load image: ${image.src}`);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingImages;

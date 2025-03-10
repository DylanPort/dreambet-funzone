
import React, { useEffect, useRef, useState } from 'react';

interface FloatingImage {
  id: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

const FloatingImages = () => {
  const [images, setImages] = useState<FloatingImage[]>([]);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const imagePaths = [
      '/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png',
      '/lovable-uploads/24e94b9d-6b95-4cee-9dbc-c78f440e3f68.png',
      '/lovable-uploads/4cf5638c-4544-455d-baf2-37470b161dbd.png',
      '/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png',
      '/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png',
      '/lovable-uploads/716d1861-1000-4986-ba2f-15693a5816af.png',
      '/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png',
      '/lovable-uploads/8c486ae4-3f72-46b0-9d0a-ecbf63c37968.png',
      '/lovable-uploads/b4c3d83c-03ad-43c5-bbc1-ade4e2d1c15b.png',
      '/lovable-uploads/cacd6344-a731-4fcf-8ae1-de6fc1aee605.png',
    ];

    const initialImages: FloatingImage[] = imagePaths.map((_, index) => ({
      id: index,
      x: Math.random() * (window.innerWidth - 100),
      y: Math.random() * (window.innerHeight - 100),
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.5
    }));

    setImages(initialImages);

    const animate = () => {
      setImages(prevImages => prevImages.map(img => {
        let newX = img.x + img.speedX;
        let newY = img.y + img.speedY;
        let newSpeedX = img.speedX;
        let newSpeedY = img.speedY;
        
        // Bounce off walls
        if (newX <= 0 || newX >= window.innerWidth - 100) {
          newSpeedX = -img.speedX;
          newX = newX <= 0 ? 0 : window.innerWidth - 100;
        }
        if (newY <= 0 || newY >= window.innerHeight - 100) {
          newSpeedY = -img.speedY;
          newY = newY <= 0 ? 0 : window.innerHeight - 100;
        }

        return {
          ...img,
          x: newX,
          y: newY,
          speedX: newSpeedX,
          speedY: newSpeedY,
          rotation: (img.rotation + img.rotationSpeed) % 360
        };
      }));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      setImages(prevImages => prevImages.map(img => ({
        ...img,
        x: Math.min(img.x, window.innerWidth - 100),
        y: Math.min(img.y, window.innerHeight - 100)
      })));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {images.map((img, index) => (
        <img
          key={img.id}
          src={`/lovable-uploads/${[
            '0ac8fb50-def8-4e80-8f31-1c24a76d49de.png',
            '24e94b9d-6b95-4cee-9dbc-c78f440e3f68.png',
            '4cf5638c-4544-455d-baf2-37470b161dbd.png',
            '575dd9fd-27d8-443c-8167-0af64089b9cc.png',
            '5887548a-f14d-402c-8906-777603cd0875.png',
            '716d1861-1000-4986-ba2f-15693a5816af.png',
            '74707f80-3a88-4b9c-82d2-5a590a3a32df.png',
            '8c486ae4-3f72-46b0-9d0a-ecbf63c37968.png',
            'b4c3d83c-03ad-43c5-bbc1-ade4e2d1c15b.png',
            'cacd6344-a731-4fcf-8ae1-de6fc1aee605.png',
          ][index]}`}
          alt={`Floating image ${index + 1}`}
          className="absolute w-12 h-12 opacity-20 hover:opacity-40 transition-opacity duration-300"
          style={{
            transform: `translate(${img.x}px, ${img.y}px) rotate(${img.rotation}deg)`,
            transition: 'transform 0.1s linear'
          }}
        />
      ))}
    </div>
  );
};

export default FloatingImages;

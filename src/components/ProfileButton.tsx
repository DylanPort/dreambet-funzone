
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ProfileButton = () => {
  return (
    <Link to="/profile">
      <Button 
        variant="ghost"
        className="flex items-center gap-2 text-white transition-all duration-300"
      >
        <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
          <img 
            src="/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <span>Profile</span>
      </Button>
    </Link>
  );
};

export default ProfileButton;


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
            src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" 
            alt="Profile" 
            className="w-full h-full object-contain"
          />
        </div>
        <span>Profile</span>
      </Button>
    </Link>
  );
};

export default ProfileButton;

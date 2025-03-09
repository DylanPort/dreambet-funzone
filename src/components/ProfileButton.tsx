
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProfileButton = () => {
  return (
    <Link to="/profile">
      <Button 
        className="flex items-center gap-2 bg-gradient-to-r from-purple-400 to-blue-500 hover:from-purple-500 hover:to-blue-600 text-white transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center overflow-hidden">
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

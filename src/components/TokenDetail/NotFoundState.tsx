
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const NotFoundState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200 max-w-md">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <p className="text-lg font-medium text-amber-600 mb-2">Token Not Found</p>
        <p className="text-gray-700">The token you're looking for doesn't exist or has been removed.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/betting')}
        >
          Return to Betting Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFoundState;

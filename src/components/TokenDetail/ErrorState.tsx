
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  errorMessage: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-lg font-medium text-red-600 mb-2">Error Loading Token</p>
        <p className="text-gray-700 mb-4">{errorMessage}</p>
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

export default ErrorState;

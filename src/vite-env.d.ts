
/// <reference types="vite/client" />

// Add declarations for packages that might be missing type definitions
declare module 'lucide-react';
declare module 'date-fns';
declare module 'recharts' {
  export * from 'recharts';
}
declare module 'sonner';
declare module 'react-router-dom';
declare module 'react-day-picker';
declare module 'vaul';
declare module 'react-resizable-panels';

// Add types for our application
interface ExampleDataType {
  title: string;
  description: string;
  users: UserDataType[];
  pool?: number;
  requested?: number;
  factor?: number;
}

interface UserDataType {
  name: string;
  deposit: number;
  pxb: number;
  change: number;
  color: string;
  rank?: number;
  payout?: number;
}

// Helper function for typeguards
function isPayoutData(data: ExampleDataType): data is ExampleDataType & { pool: number, requested: number, factor: number } {
  return 'pool' in data && 'requested' in data && 'factor' in data;
}

// Add any other necessary declarations

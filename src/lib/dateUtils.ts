
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export const isCurrentPhase = (phaseId: string): boolean => {
  // Implement logic to determine if a phase is current
  const currentDate = new Date();
  // Add specific logic based on your phase date ranges
  return false; // Placeholder
};

export const getDateStatus = (date: Date): 'past' | 'current' | 'future' => {
  const currentDate = new Date();
  if (date < currentDate) return 'past';
  // Add more specific logic if needed
  return 'future';
};

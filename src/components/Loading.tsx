
import React from 'react';

const Loading = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-dream-accent1 mb-4"></div>
      <p className="text-dream-foreground/70">{message}</p>
    </div>
  );
};

export default Loading;

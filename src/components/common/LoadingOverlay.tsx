import React from 'react';
import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-8 flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};
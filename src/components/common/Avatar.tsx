import React from 'react';
import { cn } from '@/utils/cn';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  fallback,
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-muted overflow-hidden',
        sizes[size],
        className
      )}
    >
      {showFallback ? (
        fallback ? (
          <span className="font-medium text-muted-foreground uppercase">
            {fallback}
          </span>
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};
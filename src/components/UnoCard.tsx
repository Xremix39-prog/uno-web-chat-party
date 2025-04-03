
import React from 'react';
import { Card, CardColor } from '../types/uno';
import { cn } from '@/lib/utils';

interface UnoCardProps {
  card?: Card;
  isPlayable?: boolean;
  onClick?: () => void;
  isBack?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UnoCard: React.FC<UnoCardProps> = ({
  card,
  isPlayable = false,
  onClick,
  isBack = false,
  className,
  size = 'md',
}) => {
  if (!card && !isBack) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-12 h-16 text-lg',
    md: 'w-16 h-24 text-2xl',
    lg: 'w-20 h-32 text-3xl',
  };

  const getCardColorClass = (color: CardColor) => {
    switch (color) {
      case 'red':
        return 'uno-card-red';
      case 'blue':
        return 'uno-card-blue';
      case 'green':
        return 'uno-card-green';
      case 'yellow':
        return 'uno-card-yellow';
      case 'wild':
        return 'uno-card-wild';
      default:
        return 'uno-card-back';
    }
  };

  const getCardSymbol = (card: Card) => {
    switch (card.value) {
      case 'skip':
        return '⊘';
      case 'reverse':
        return '⇄';
      case 'draw2':
        return '+2';
      case 'wild':
        return '🌈';
      case 'wild4':
        return '+4';
      default:
        return card.value;
    }
  };

  return (
    <div
      className={cn(
        'uno-card relative',
        sizeClasses[size],
        isBack ? 'uno-card-back' : card ? getCardColorClass(card.color) : '',
        isPlayable ? 'cursor-pointer hover:scale-110 hover:-translate-y-2 transition-transform' : '',
        className
      )}
      onClick={isPlayable && onClick ? onClick : undefined}
    >
      {!isBack && card && (
        <>
          <div className="absolute top-1 left-1 text-sm">{getCardSymbol(card)}</div>
          <div className="text-3xl font-bold">{getCardSymbol(card)}</div>
          <div className="absolute bottom-1 right-1 text-sm transform rotate-180">{getCardSymbol(card)}</div>
        </>
      )}
    </div>
  );
};

export default UnoCard;

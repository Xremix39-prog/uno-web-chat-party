
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
  stackIndex?: number; // For stacking cards in a deck
}

const UnoCard: React.FC<UnoCardProps> = ({
  card,
  isPlayable = false,
  onClick,
  isBack = false,
  className,
  size = 'md',
  stackIndex = 0,
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

  // Calculate offset for stacked cards
  const stackStyle = stackIndex > 0 ? {
    marginTop: `-${stackIndex * 2}px`,
    marginLeft: `${stackIndex * 0.5}px`,
    zIndex: 10 - stackIndex,
  } : {};

  return (
    <div
      className={cn(
        'uno-card relative',
        sizeClasses[size],
        isBack ? 'uno-card-back' : card ? getCardColorClass(card.color) : '',
        isPlayable ? 'cursor-pointer hover:scale-110 hover:-translate-y-2 transition-transform' : '',
        stackIndex > 0 ? 'absolute' : '',
        className
      )}
      style={stackStyle}
      onClick={isPlayable && onClick ? onClick : undefined}
    >
      {!isBack && card && (
        <>
          <div className="absolute top-1 left-1 text-sm font-bold">{getCardSymbol(card)}</div>
          <div className="flex items-center justify-center h-full text-3xl font-bold relative">
            <div className="card-symbol-large">{getCardSymbol(card)}</div>
            {/* Add card circle background */}
            <div className="absolute w-3/4 h-3/4 rounded-full bg-white/30 -z-10"></div>
          </div>
          <div className="absolute bottom-1 right-1 text-sm font-bold transform rotate-180">{getCardSymbol(card)}</div>
        </>
      )}
      {isBack && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white font-bold text-lg rotate-45">UNO</div>
        </div>
      )}
    </div>
  );
};

export default UnoCard;

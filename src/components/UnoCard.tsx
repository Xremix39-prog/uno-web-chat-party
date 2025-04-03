
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
  style?: React.CSSProperties;
  stackPosition?: number;
}

const UnoCard: React.FC<UnoCardProps> = ({
  card,
  isPlayable = false,
  onClick,
  isBack = false,
  className,
  size = 'md',
  style,
  stackPosition = 0,
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

  // Calculate stacking effect styles
  const stackStyle: React.CSSProperties = stackPosition > 0 
    ? {
        position: 'absolute',
        top: `-${stackPosition * 1}px`,
        left: `${stackPosition * 0.5}px`,
        zIndex: 10 - stackPosition,
        ...style
      }
    : { ...style };

  return (
    <div
      className={cn(
        'uno-card relative rounded-xl overflow-hidden',
        sizeClasses[size],
        isBack ? 'uno-card-back' : card ? getCardColorClass(card.color) : '',
        isPlayable ? 'cursor-pointer hover:scale-110 hover:-translate-y-2 transition-transform' : '',
        isPlayable && 'animate-pulse-subtle',
        className
      )}
      onClick={isPlayable && onClick ? onClick : undefined}
      style={stackStyle}
    >
      {!isBack && card && (
        <>
          <div className="absolute top-1 left-1 text-sm font-bold">{getCardSymbol(card)}</div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="text-3xl font-bold transform -rotate-12 scale-150">
              {getCardSymbol(card)}
            </div>
          </div>
          <div className="absolute bottom-1 right-1 text-sm font-bold transform rotate-180">{getCardSymbol(card)}</div>
          
          {/* Card inner white oval */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-2/3 bg-white/90 rounded-full -rotate-12 flex items-center justify-center">
            <div className="text-4xl font-bold">
              {getCardSymbol(card)}
            </div>
          </div>
        </>
      )}
      
      {isBack && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-700 to-red-900">
          <div className="absolute inset-2 rounded-lg border-2 border-white/30"></div>
          <div className="w-3/4 h-1/2 bg-white rounded-full -rotate-12 flex items-center justify-center shadow-inner">
            <span className="text-3xl font-bold text-red-700">UNO</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnoCard;

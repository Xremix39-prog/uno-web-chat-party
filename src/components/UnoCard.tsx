
import React from 'react';
import { Card as CardType } from '@/types/uno';
import { cn } from '@/lib/utils';

interface UnoCardProps {
  card?: CardType;
  isBack?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isPlayable?: boolean;
  isSelected?: boolean;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

const UnoCard: React.FC<UnoCardProps> = ({
  card,
  isBack = false,
  size = 'md',
  isPlayable = false,
  isSelected = false,
  className = '',
  onClick,
  onDoubleClick
}) => {
  // Size classes
  const sizeClasses = {
    sm: "w-10 h-14",
    md: "w-16 h-24",
    lg: "w-20 h-30"
  };
  
  // Card back design
  if (isBack) {
    return (
      <div 
        className={cn(
          "rounded-lg bg-gradient-to-br from-red-600 to-red-800 border-2 border-white shadow-md",
          sizeClasses[size],
          className
        )}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        <div className="h-full w-full rounded-md bg-white/10 flex items-center justify-center">
          <div className="bg-white/90 transform -rotate-12 rounded-full w-3/4 h-1/2 flex items-center justify-center">
            <span className="font-bold text-red-600 transform rotate-12 text-xl">UNO</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!card) return null;
  
  // Colors
  const colorClasses = {
    red: "from-red-500 to-red-700 text-white",
    blue: "from-blue-500 to-blue-700 text-white",
    green: "from-green-500 to-green-700 text-white",
    yellow: "from-yellow-400 to-yellow-600 text-black",
    wild: "from-gray-700 to-black text-white"
  };
  
  const symbolSize = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-4xl';
  const cornerSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';
  
  const getSymbol = () => {
    switch (card.value) {
      case 'skip':
        return (
          <div className="rounded-full border-4 relative">
            <div className="absolute inset-0 border-t-4 transform rotate-45"></div>
          </div>
        );
      case 'reverse':
        return (
          <div className="flex">
            <div className="border-2 border-current w-3 h-3 rounded-full relative">
              <div className="absolute top-0.5 left-0.5 border-t-2 border-r-2 border-current w-2 h-2 transform rotate-45"></div>
            </div>
            <div className="border-2 border-current w-3 h-3 rounded-full relative transform -scale-x-100">
              <div className="absolute top-0.5 left-0.5 border-t-2 border-r-2 border-current w-2 h-2 transform rotate-45"></div>
            </div>
          </div>
        );
      case 'draw2':
        return "+2";
      case 'wild':
        return (
          <div className="flex-1 grid grid-cols-2 gap-1">
            <div className="bg-red-500 rounded-tl-full"></div>
            <div className="bg-blue-500 rounded-tr-full"></div>
            <div className="bg-yellow-400 rounded-bl-full"></div>
            <div className="bg-green-500 rounded-br-full"></div>
          </div>
        );
      case 'wild4':
        return (
          <div className="flex flex-col">
            <div className="flex-1 grid grid-cols-2 gap-0.5">
              <div className="bg-red-500 rounded-tl-full"></div>
              <div className="bg-blue-500 rounded-tr-full"></div>
              <div className="bg-yellow-400 rounded-bl-full"></div>
              <div className="bg-green-500 rounded-br-full"></div>
            </div>
            <div className="text-center mt-1">+4</div>
          </div>
        );
      default:
        return card.value;
    }
  };
  
  return (
    <div 
      className={cn(
        "relative rounded-lg bg-gradient-to-br border-2 border-white shadow-md transition-transform",
        colorClasses[card.color],
        sizeClasses[size],
        isPlayable ? "cursor-pointer hover:scale-110" : "",
        isSelected ? "ring-4 ring-blue-400 transform scale-105 -translate-y-2" : "",
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="absolute top-1 left-1">
        <div className={cn("font-bold", cornerSize)}>{card.value}</div>
      </div>
      
      <div className="h-full w-full flex items-center justify-center">
        <div className={cn("font-bold", symbolSize)}>
          {getSymbol()}
        </div>
      </div>
      
      <div className="absolute bottom-1 right-1 transform rotate-180">
        <div className={cn("font-bold", cornerSize)}>{card.value}</div>
      </div>
      
      {/* White center oval */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 transform -rotate-12 rounded-full w-3/4 h-1/2 flex items-center justify-center">
          <div className={cn("font-bold transform rotate-12", symbolSize, colorClasses[card.color].split(' ')[2])}>
            {getSymbol()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnoCard;

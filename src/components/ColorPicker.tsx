
import React from 'react';
import { CardColor } from '../types/uno';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelected: (color: CardColor) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ isOpen, onClose, onColorSelected }) => {
  const handleColorClick = (color: CardColor) => {
    onColorSelected(color);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a color</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 p-4">
          <button
            className="h-24 bg-uno-red rounded-lg hover:opacity-90 transition-opacity"
            onClick={() => handleColorClick('red')}
          ></button>
          <button
            className="h-24 bg-uno-blue rounded-lg hover:opacity-90 transition-opacity"
            onClick={() => handleColorClick('blue')}
          ></button>
          <button
            className="h-24 bg-uno-green rounded-lg hover:opacity-90 transition-opacity"
            onClick={() => handleColorClick('green')}
          ></button>
          <button
            className="h-24 bg-uno-yellow rounded-lg hover:opacity-90 transition-opacity"
            onClick={() => handleColorClick('yellow')}
          ></button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColorPicker;

import React, { ReactNode, useEffect, useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // This state will control the modal content's entry animation
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // When isOpen becomes true, trigger the animation by setting isContentVisible to true
      // This happens after the component is rendered with initial (invisible/scaled-down) state.
      const timer = setTimeout(() => {
        setIsContentVisible(true);
      }, 10); // Small delay to ensure CSS transition applies correctly.
      return () => clearTimeout(timer);
    } else {
      // When modal is closed, reset visibility state for the next time it opens.
      setIsContentVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null; // If not open, don't render anything.
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Base classes for the modal panel. Includes transition properties.
  // The original 'scale-95 opacity-0' are removed from here as they are now dynamic.
  const panelBaseClasses = `bg-slate-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} p-6 transform transition-all duration-300 ease-in-out`;
  
  // Dynamic classes for animation:
  // Initial state (when isContentVisible is false): opacity-0, scale-95
  // Final state (when isContentVisible is true): opacity-100, scale-100
  const panelAnimationClasses = isContentVisible 
    ? 'opacity-100 scale-100' 
    : 'opacity-0 scale-95';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        // Apply base classes and dynamic animation classes.
        // The original 'animate-modalShow' class is no longer needed.
        className={`${panelBaseClasses} ${panelAnimationClasses}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
      {/* The <style jsx global> block has been removed. */}
    </div>
  );
};

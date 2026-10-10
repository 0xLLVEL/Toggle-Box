'use client';

import React from 'react';
import { CheckIcon } from './Icons';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="toast-notification animate-slideUp">
      <div className="toast-icon">
        <CheckIcon size={16} />
      </div>
      <span className="toast-message">{message}</span>
    </div>
  );
};

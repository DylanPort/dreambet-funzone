
import * as React from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastActionElement {
  altText: string;
}

export interface ToastProps {
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'destructive' | 'success';
}

type ToastOptions = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
};

// Create the actual toast implementation using sonner
export const useToast = () => {
  return {
    toasts: [],
    toast: showToast,
    dismiss: sonnerToast.dismiss,
  };
};

// Helper function to display toasts
const showToast = (options: ToastOptions) => {
  const { title, description, variant, duration } = options;

  if (variant === 'destructive') {
    return sonnerToast.error(title, {
      description,
      duration: duration || 5000,
    });
  } else if (variant === 'success') {
    return sonnerToast.success(title, {
      description,
      duration: duration || 3000,
    });
  } else {
    return sonnerToast(title, {
      description,
      duration: duration || 3000,
    });
  }
};

// Create versions of the toast function for different variants
showToast.success = (title: string, options?: Omit<ToastOptions, 'variant'>) => {
  return sonnerToast.success(title, {
    description: options?.description,
    duration: options?.duration || 3000,
  });
};

showToast.error = (title: string, options?: Omit<ToastOptions, 'variant'>) => {
  return sonnerToast.error(title, {
    description: options?.description,
    duration: options?.duration || 5000,
  });
};

showToast.bet = (title: string, options?: Omit<ToastOptions, 'variant'>) => {
  return sonnerToast(title, {
    description: options?.description,
    duration: options?.duration || 3000,
  });
};

export const toast = showToast;

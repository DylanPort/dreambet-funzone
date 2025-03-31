// Empty implementation that does nothing but maintains the interface
// so existing code doesn't break

import * as React from "react";

export interface ToastActionElement {
  altText: string;
}

export interface ToastProps {
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'destructive' | 'success';
}

// No-op implementation that does nothing
export const useToast = () => {
  return {
    toasts: [],
    toast: noOpToast,
    dismiss: () => {},
  };
};

const noOpToast = (props: any) => {
  console.log('Toast disabled:', props);
  return { id: '0', dismiss: () => {}, update: () => {} };
};

// Create no-op versions of the toast functions to maintain the interface
noOpToast.success = (title: string, props?: any) => {
  console.log('Toast success disabled:', title, props);
  return { id: '0', dismiss: () => {}, update: () => {} };
};

noOpToast.error = (title: string, props?: any) => {
  console.log('Toast error disabled:', title, props);
  return { id: '0', dismiss: () => {}, update: () => {} };
};

noOpToast.bet = (title: string, props?: any) => {
  console.log('Toast bet disabled:', title, props);
  return { id: '0', dismiss: () => {}, update: () => {} };
};

export const toast = noOpToast;

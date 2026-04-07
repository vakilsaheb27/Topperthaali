import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateQRCodeString() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateReceiptNo() {
  return 'REC-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
}

export function getWhatsAppLink(mobile: string, message: string) {
  // Remove any non-numeric characters
  const cleanMobile = mobile.replace(/\D/g, '');
  // Assuming India country code if not provided, for simplicity. 
  // In a real app, you might want to handle country codes better.
  const phone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

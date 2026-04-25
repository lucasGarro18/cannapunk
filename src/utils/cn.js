import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names intelligently (clsx + tailwind-merge)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

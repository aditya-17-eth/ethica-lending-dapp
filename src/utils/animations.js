/**
 * Framer Motion animation variants for consistent animations across the application
 * These variants follow the design system specifications for smooth, performant animations
 */

/**
 * Fade in with upward motion - ideal for section entrances
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

/**
 * Simple fade in - ideal for subtle content reveals
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 }
};

/**
 * Slide in from left - ideal for side navigation or panels
 */
export const slideIn = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.4 }
};

/**
 * Stagger container - creates sequential animation of children
 * Use with motion components that have child elements
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

/**
 * Hover scale effect - ideal for interactive cards and buttons
 */
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

/**
 * Hover lift effect - ideal for cards with shadow
 */
export const hoverLift = {
  y: -5,
  transition: { duration: 0.2 }
};

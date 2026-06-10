/**
 * Framer-motion feature bundle, loaded lazily via <LazyMotion>. Split into its
 * own module so the animation engine lands in an async chunk instead of the
 * critical-path bundle. `domMax` (not `domAnimation`) because the upload card
 * uses layout/layoutId shared-element transitions.
 */
export { domMax as default } from "framer-motion";

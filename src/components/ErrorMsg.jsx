import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

/**
 * A shared error message component for form validation.
 * Consistent styling across all pages.
 */
const ErrorMsg = ({ message }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-1 text-red-500 mt-1 ml-1"
    >
      <AlertCircle className="w-3.5 h-3.5" />
      <span className="text-xs font-semibold">{message}</span>
    </motion.div>
  );
};

export default ErrorMsg;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

export const Sheet = ({ isOpen, onClose, children, className = '' }) => {
  const { prefs } = useStore((s) => ({ prefs: s.prefs }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={prefs.reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25 }}
            className={`fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl border-t border-white/10 shadow-2xl z-50 max-h-[90vh] overflow-y-auto ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


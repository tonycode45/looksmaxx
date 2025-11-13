import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

let toastId = 0;
const toasts = new Map();
const listeners = new Set();

export function toast(message, type = 'info') {
  const id = toastId++;
  toasts.set(id, { id, message, type });
  listeners.forEach((listener) => listener());
  setTimeout(() => {
    toasts.delete(id);
    listeners.forEach((listener) => listener());
  }, 3000);
  return id;
}

export function useToasts() {
  const [items, setItems] = React.useState([]);

  useEffect(() => {
    const update = () => setItems([...toasts.values()]);
    listeners.add(update);
    update();
    return () => listeners.delete(update);
  }, []);

  return items;
}

export function ToastContainer() {
  const items = useToasts();
  const { prefs } = useStore((s) => ({ prefs: s.prefs }));

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={prefs.reduceMotion ? { duration: 0 } : {}}
            className={`px-4 py-3 rounded-xl shadow-lg ${
              item.type === 'error'
                ? 'bg-red-500'
                : item.type === 'success'
                ? 'bg-green-500'
                : 'bg-zinc-800'
            } text-white`}
          >
            {item.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


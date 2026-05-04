import { FiX } from 'react-icons/fi';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-slide-up border border-white/60`}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md flex items-center justify-between p-6 border-b border-surface-100 rounded-t-3xl">
          <h2 className="text-lg font-bold text-primary-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-xl transition-colors text-surface-400 hover:text-surface-600">
            <FiX size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

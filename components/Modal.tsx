
import React from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-lg z-10"
                    aria-label="Cerrar modal"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;

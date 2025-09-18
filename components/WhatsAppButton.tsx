import React from 'react';
import { WhatsAppIcon } from './Icons';

interface WhatsAppButtonProps {
    phoneNumber: string;
    message: string;
    disabled?: boolean;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phoneNumber, message, disabled = false }) => {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    return (
        <a 
            href={disabled ? undefined : whatsappUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-center px-4 py-3 font-bold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => { if (disabled) e.preventDefault(); }}
            aria-disabled={disabled}
        >
            <WhatsAppIcon className="w-6 h-6 mr-3" />
            <span>Confirmar Pedido por WhatsApp</span>
        </a>
    );
};

export default WhatsAppButton;

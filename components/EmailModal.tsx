import React, { useState } from 'react';
import Modal from './Modal';
import { sendEmailQuote } from '../services/notificationService';
import { CheckCircleIcon, MailIcon } from './Icons';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    quoteMessage: string;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, quoteMessage }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleClose = () => {
        onClose();
        // Reset state after a short delay to allow for closing animation
        setTimeout(() => {
            setEmail('');
            setStatus('idle');
            setErrorMessage('');
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('sending');
        setErrorMessage('');

        try {
            const result = await sendEmailQuote(email, quoteMessage);
            if (result.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(result.message);
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Ocurrió un error inesperado al enviar el correo.');
        }
    };

    if (!isOpen) return null;

    const renderContent = () => {
        switch (status) {
            case 'sending':
                return (
                    <div className="text-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600">Enviando cotización...</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="text-center p-8">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800">¡Cotización Enviada!</h3>
                        <p className="text-slate-600 mt-2">Hemos enviado el resumen de tu pedido a <strong>{email}</strong>.</p>
                        <button onClick={handleClose} className="mt-6 px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                            Cerrar
                        </button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center p-8">
                        <h3 className="text-xl font-bold text-red-600">Error al Enviar</h3>
                        <p className="text-slate-600 mt-2">{errorMessage}</p>
                        <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                            Intentar de Nuevo
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Dirección de Correo Electrónico
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    className="block w-full rounded-md border-slate-300 pl-10 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    placeholder="tu@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                        >
                            Enviar Cotización
                        </button>
                    </form>
                );
        }
    };
    
    return (
        <Modal onClose={handleClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
                {status === 'idle' && (
                     <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Enviar Cotización por Correo</h2>
                )}
                {renderContent()}
            </div>
        </Modal>
    );
};

export default EmailModal;

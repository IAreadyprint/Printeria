import React from 'react';
import Modal from './Modal';

interface DownloadInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DownloadInfoModal: React.FC<DownloadInfoModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg text-center">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">¡Archivo Descargado!</h2>
                
                 <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Instrucciones para tu Impresor:</h3>
                    <p className="text-sm">
                        El archivo está listo para que tu impresor favorito agregue la capa de <strong>tinta blanca</strong> y <strong>barniz UV</strong> si es requerida.
                    </p>
                     <p className="text-sm">
                        Finalmente, debe exportar a formato <strong>TIFF</strong> (recomendamos 300ppp mínimo) para proceder a la impresión.
                    </p>
                </div>

                 <div className="mt-6">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DownloadInfoModal;

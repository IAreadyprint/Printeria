import React from 'react';

interface BackgroundRemovalToolProps {
    onRemove: () => void;
    isRemoving: boolean;
}

const BackgroundRemovalTool: React.FC<BackgroundRemovalToolProps> = ({ onRemove, isRemoving }) => {
    const buttonClasses = `
        relative inline-flex items-center h-7 rounded-full w-12 transition-colors duration-300 ease-in-out
        ${isRemoving ? 'bg-cyan-600' : 'bg-slate-300 hover:bg-slate-400'}
    `;
    const circleClasses = `
        inline-flex items-center justify-center w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ease-in-out
        ${isRemoving ? 'translate-x-6' : 'translate-x-1'}
    `;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-slate-800">Quitar Fondo con IA</h3>
                    <p className="text-sm text-slate-500">Elimina el fondo para un sticker con contorno perfecto.</p>
                </div>
                <button
                    onClick={onRemove}
                    disabled={isRemoving}
                    role="switch"
                    aria-checked={isRemoving}
                    className={`${buttonClasses} cursor-pointer disabled:cursor-not-allowed`}
                >
                    <span className={circleClasses}>
                        {isRemoving && (
                             <svg className="animate-spin h-4 w-4 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default BackgroundRemovalTool;

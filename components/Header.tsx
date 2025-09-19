import React from 'react';
import { WhatsAppIcon } from './Icons';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-3">
                <div className="flex items-center justify-between">
                    <a href="https://printeria.mx" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4">
                        <img 
                            src="https://cdn.shopify.com/s/files/1/0759/0356/6039/files/printeria-logo-color.svg?v=1757827982"
                            alt="Printeria Logo"
                            className="h-8 sm:h-10"
                        />
                        <span className="text-xl font-bold text-slate-700 hidden sm:inline">
                            Genio Gráfico <span className="font-light text-slate-500">by Printería</span>
                        </span>
                    </a>
                     <div className="flex items-center space-x-4">
                        <p className="text-sm text-slate-500 hidden md:block">
                            Descarga Gratis tus formaciones generadas en minutos con IA.
                        </p>
                        <div className="relative group">
                             <a 
                                href="https://wa.me/5215633468652?text=%C2%A1Hola!%20Necesito%20ayuda%20con%20la%20aplicaci%C3%B3n%20Genio%20Gr%C3%A1fico."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center p-2 bg-green-100 rounded-full text-green-600 hover:bg-green-200 transition-colors"
                                aria-label="Contactar por WhatsApp"
                             >
                                <WhatsAppIcon className="w-6 h-6" />
                            </a>
                            <div className="absolute top-full mt-2 right-0 w-64 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                <strong>¿Complicado?</strong> Asistencia humana de 9am a 6pm, cotizaciones, soporte de App, venta directa.
                                <div className="absolute w-3 h-3 bg-slate-800 transform rotate-45 -top-1 right-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
                <div className="flex items-center justify-between">
                    <img 
                        src="https://cdn.shopify.com/s/files/1/0759/0356/6039/files/printeria-logo-color.svg?v=1757827982"
                        alt="Printeria Logo"
                        className="h-8 sm:h-10"
                    />
                     <p className="text-sm text-slate-500 hidden sm:block">
                        Descarga Gratis tus formaciones generadas en minutos con IA.
                     </p>
                </div>
            </div>
        </header>
    );
};

export default Header;

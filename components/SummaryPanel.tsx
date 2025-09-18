import React, { useMemo, useState } from 'react';
import { DesignConfig, ImageInfo, LayoutInfo, ProductionMode } from '../types';
import ImpositionPreview from './ImpositionPreview';
import CostCalculator from './CostCalculator';
import WhatsAppButton from './WhatsAppButton';
import ProductSheetModal from './ProductSheetModal';

interface SummaryPanelProps {
    config: DesignConfig;
    image: ImageInfo | null;
    layout: LayoutInfo;
    onDownload: (type: 'print' | 'cut') => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ config, image, layout, onDownload }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { totalSheets, stickersPerSheet } = layout;

    const isReadyForQuote = config.width > 0 && config.height > 0 && config.quantity > 0 && image !== null;

    const quoteMessage = useMemo(() => {
        if (!isReadyForQuote) return '';
        const bgColorText = config.backgroundColor ? `\n- Color de Fondo: ${config.backgroundColor}` : '';
        return `¡Hola Printeria! Quisiera cotizar el siguiente pedido de stickers:
- Imagen: ${image?.file.name}
- Cantidad: ${config.quantity} stickers
- Medidas: ${config.width} x ${config.height} cm
- Forma de Corte: ${config.shape}${bgColorText}
- Modo de Producción: ${config.mode}
- Acabado: ${config.lamination}
- Formación: ${stickersPerSheet} por ${config.mode === ProductionMode.XEROX ? 'planilla' : 'pliego'}, ${totalSheets} en total.
¡Gracias!`;
    }, [config, image, stickersPerSheet, totalSheets, isReadyForQuote]);

    return (
        <div className="p-5 bg-white rounded-2xl shadow-lg border border-slate-200 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Resumen y Cotización</h2>
            {isReadyForQuote ? (
                <div className="space-y-4">
                    <div className="text-center bg-cyan-50 p-3 rounded-lg">
                        <p className="font-semibold text-cyan-800">Caben <span className="text-2xl">{stickersPerSheet}</span> stickers por {config.mode === ProductionMode.XEROX ? 'planilla' : 'pliego'}.</p>
                        <p className="text-sm text-cyan-700">Necesitarás un total de <span className="font-bold">{totalSheets}</span> {config.mode === ProductionMode.XEROX ? 'planillas' : 'pliegos'} para tu pedido.</p>
                    </div>
                    
                    <ImpositionPreview 
                        config={config} 
                        layout={layout}
                        image={image}
                        onZoom={() => setIsModalOpen(true)}
                    />
                    
                    <CostCalculator config={config} totalSheets={totalSheets} />

                     <div className="pt-4 border-t border-slate-200 space-y-3">
                        <h3 className="text-lg font-bold text-slate-800">Archivos de Producción</h3>
                        <button
                            onClick={() => onDownload('print')}
                            disabled={!isReadyForQuote}
                            className="w-full px-4 py-2 font-bold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            Descargar IMPRESIÓN (SVG)
                        </button>
                        <button
                            onClick={() => onDownload('cut')}
                            disabled={!isReadyForQuote}
                            className="w-full px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
                        >
                            Descargar CORTE (SVG)
                        </button>
                    </div>
                    
                    <WhatsAppButton 
                        phoneNumber="5215633468652"
                        message={quoteMessage}
                        disabled={!isReadyForQuote}
                    />

                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-slate-500">Completa la configuración y carga una imagen para ver el resumen de tu pedido.</p>
                </div>
            )}
             <ProductSheetModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                config={config}
                image={image}
            />
        </div>
    );
};

export default SummaryPanel;
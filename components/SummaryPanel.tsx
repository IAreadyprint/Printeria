import React from 'react';
import { DesignConfig, ImageInfo, LayoutInfo, ProductionMode, MimakiInputMode } from '../types';
import CostCalculator from './CostCalculator';
import WhatsAppButton from './WhatsAppButton';
import { MailIcon } from './Icons';

interface SummaryPanelProps {
    config: DesignConfig;
    image: ImageInfo | null;
    layout: LayoutInfo;
    onDownload: (type: 'print' | 'cut') => void;
    isReady: boolean;
    quoteMessage: string;
    onOpenEmailModal: () => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ config, image, layout, onDownload, isReady, quoteMessage, onOpenEmailModal }) => {
    const { totalSheets, stickersPerSheet, linearMeters, totalStickersProduced } = layout;

    const renderSummaryText = () => {
        if (!config.mode) return null;
        const isMimakiDTF = config.mode === ProductionMode.MIMAKI_DTF_UV;
        const isMimakiHolo = config.mode === ProductionMode.MIMAKI_HOLO_UV;
        
        if (isMimakiDTF || isMimakiHolo) {
            let primaryText = `Se producirán`;
            if (isMimakiHolo) {
                primaryText = `Con <span class="text-2xl">${config.linearLengthCm / 100} metro(s)</span> de impresión se producen`;
            } else if (config.mimakiInputMode === MimakiInputMode.LENGTH) {
                 primaryText = `Con <span class="text-2xl">${config.linearLengthCm} cm</span> de impresión se producen`;
            }

            return (
                 <div className="text-center bg-cyan-50 p-3 rounded-lg">
                    <p className="font-semibold text-cyan-800" dangerouslySetInnerHTML={{ __html: `${primaryText} <span class="text-2xl">${totalStickersProduced}</span> stickers.` }} />
                    <p className="text-sm text-cyan-700">Tu pedido requiere un total de <span className="font-bold">{linearMeters?.toFixed(2)}</span> metros lineales de impresión.</p>
                </div>
            );
        }
        return (
            <div className="text-center bg-cyan-50 p-3 rounded-lg">
                <p className="font-semibold text-cyan-800">Caben <span className="className text-2xl">{stickersPerSheet}</span> stickers por {config.mode === ProductionMode.XEROX ? 'planilla' : 'pliego'}.</p>
                <p className="text-sm text-cyan-700">Necesitarás un total de <span className="font-bold">{totalSheets}</span> {config.mode === ProductionMode.XEROX ? 'planillas' : 'pliegos'} para tu pedido.</p>
            </div>
        );
    };

    return (
        <div className="p-5 bg-white rounded-2xl shadow-lg border border-slate-200 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Resumen y Cotización</h2>
            {isReady ? (
                <div className="space-y-4">
                    {renderSummaryText()}
                    
                    <CostCalculator config={config} layout={layout} />

                     <div className="pt-4 border-t border-slate-200 space-y-3">
                        <h3 className="text-lg font-bold text-slate-800">Archivos de Producción</h3>
                        <p className="text-xs text-slate-500">
                            Descarga los archivos SVG con el arte final y las líneas de corte para tu producción.
                        </p>
                        <button
                            onClick={() => onDownload('print')}
                            disabled={!isReady}
                            className="w-full px-4 py-2 font-bold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            Descargar ARTE (SVG)
                        </button>
                        <button
                            onClick={() => onDownload('cut')}
                            disabled={!isReady}
                            className="w-full px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
                        >
                            Descargar CORTE (SVG)
                        </button>
                    </div>
                    
                    <WhatsAppButton 
                        phoneNumber="5215633468652"
                        message={quoteMessage}
                        disabled={!isReady}
                    />
                     <button
                        onClick={onOpenEmailModal}
                        disabled={!isReady}
                        className={`w-full flex items-center justify-center px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <MailIcon className="w-5 h-5 mr-2" />
                        Enviar por Correo
                    </button>


                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-slate-500">Completa la configuración y carga una imagen para ver el resumen de tu pedido.</p>
                </div>
            )}
        </div>
    );
};

export default SummaryPanel;
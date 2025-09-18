import React from 'react';
import { DesignConfig, ProductionMode, LaminationType, CutShape } from '../types';
import { VectorizeIcon } from './Icons'; // Assuming you might want an icon for background removal too

interface ConfigurationPanelProps {
    config: DesignConfig;
    onConfigChange: (newConfig: Partial<DesignConfig>) => void;
    onVectorize: () => void;
    isVectorizing: boolean;
    onRemoveBackground: () => void;
    isRemovingBackground: boolean;
    imageLoaded: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ 
    config, 
    onConfigChange, 
    onVectorize, 
    isVectorizing, 
    onRemoveBackground,
    isRemovingBackground,
    imageLoaded 
}) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericValue = ['quantity', 'width', 'height', 'cornerRadius'].includes(name) ? parseFloat(value) : value;
        onConfigChange({ [name]: numericValue });
    };

    const handleSaveConfig = () => {
        try {
            localStorage.setItem('stickerDesignerConfig', JSON.stringify(config));
            alert('¡Configuración guardada exitosamente!');
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
            alert('Error: No se pudo guardar la configuración.');
        }
    };

    const handleLoadConfig = () => {
        try {
            const savedConfigJSON = localStorage.getItem('stickerDesignerConfig');
            if (savedConfigJSON) {
                const loadedConfig: DesignConfig = JSON.parse(savedConfigJSON);
                if (typeof loadedConfig === 'object' && loadedConfig !== null && 'quantity' in loadedConfig) {
                    onConfigChange(loadedConfig);
                    alert('¡Configuración cargada exitosamente!');
                } else {
                    throw new Error("Invalid config format in localStorage.");
                }
            } else {
                alert('No se encontró ninguna configuración guardada.');
            }
        } catch (error) {
            console.error('Error al cargar la configuración:', error);
            alert('Error: No se pudo cargar la configuración. Puede que esté corrupta.');
        }
    };

    const BRAND_COLORS = ['#FFFFFF', '#18181b', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899'];
    
    return (
        <div className="p-5 bg-white rounded-2xl shadow-lg border border-slate-200 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Configura tu Sticker</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Cantidad Total</label>
                    <input type="number" name="quantity" id="quantity" value={config.quantity} onChange={handleInputChange} min="1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"/>
                </div>
                <div className="flex items-end space-x-2">
                    <div className="flex-1">
                        <label htmlFor="width" className="block text-sm font-medium text-slate-700">Ancho (cm)</label>
                        <input type="number" name="width" id="width" value={config.width} onChange={handleInputChange} min="1" step="0.1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"/>
                    </div>
                    <span className="text-slate-500 pb-2">x</span>
                    <div className="flex-1">
                        <label htmlFor="height" className="block text-sm font-medium text-slate-700">Alto (cm)</label>
                        <input type="number" name="height" id="height" value={config.height} onChange={handleInputChange} min="1" step="0.1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"/>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Color de Fondo</label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {BRAND_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${config.backgroundColor === color ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-white'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => onConfigChange({ backgroundColor: color })}
                            aria-label={`Seleccionar color ${color}`}
                        />
                    ))}
                    <div className="relative w-8 h-8">
                        <input
                            type="color"
                            className="absolute inset-0 w-full h-full rounded-full border-2 border-slate-300 cursor-pointer appearance-none bg-transparent"
                            value={config.backgroundColor || '#ffffff'}
                            onChange={(e) => onConfigChange({ backgroundColor: e.target.value })}
                        />
                    </div>
                     <input
                        type="text"
                        className="w-24 rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm"
                        placeholder="#FFFFFF"
                        value={config.backgroundColor || ''}
                        onChange={(e) => onConfigChange({ backgroundColor: e.target.value })}
                        onBlur={(e) => {
                            let value = e.target.value.trim();
                            if (value && !value.startsWith('#')) {
                                value = `#${value}`;
                                onConfigChange({ backgroundColor: value });
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="px-3 py-1 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-100"
                        onClick={() => onConfigChange({ backgroundColor: null })}
                    >
                        Transparente
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Tip: Usa "Quitar Fondo con IA" para que el color sea visible.
                </p>
            </div>

            <div>
                <label htmlFor="shape" className="block text-sm font-medium text-slate-700">Forma de Corte</label>
                <select name="shape" id="shape" value={config.shape} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                    {Object.values(CutShape).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
                <h3 className="text-sm font-semibold text-slate-600">Gestión de Configuración</h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleSaveConfig}
                        className="w-full flex items-center justify-center px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        Guardar Diseño
                    </button>
                    <button
                        onClick={handleLoadConfig}
                        className="w-full flex items-center justify-center px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        Cargar Diseño
                    </button>
                </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
                <h3 className="text-sm font-semibold text-slate-600">Herramientas con IA</h3>
                 <button 
                    onClick={onRemoveBackground} 
                    disabled={isRemovingBackground || !imageLoaded}
                    className="w-full flex items-center justify-center px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors"
                >
                    {isRemovingBackground ? 'Procesando...' : 'Quitar Fondo con IA'}
                </button>
                <button 
                    onClick={onVectorize} 
                    disabled={isVectorizing || !imageLoaded}
                    className="w-full flex items-center justify-center px-4 py-2 font-bold text-white bg-slate-700 rounded-lg shadow-md hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    <VectorizeIcon className={`w-5 h-5 mr-2 ${isVectorizing ? 'animate-spin' : ''}`} />
                    {isVectorizing ? 'Generando contorno...' : 'Generar Contorno con IA'}
                </button>
            </div>


            {config.shape === CutShape.ROUNDED_SQUARE && (
                <div>
                     <label htmlFor="cornerRadius" className="block text-sm font-medium text-slate-700">Radio de Esquina (mm)</label>
                    <input type="number" name="cornerRadius" id="cornerRadius" value={config.cornerRadius} onChange={handleInputChange} min="0" step="0.5" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"/>
                </div>
            )}
             <div>
                <label htmlFor="mode" className="block text-sm font-medium text-slate-700">Modo de Producción</label>
                <select name="mode" id="mode" value={config.mode} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                    {Object.values(ProductionMode).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
             {config.mode === ProductionMode.XEROX && (
                <div>
                    <label htmlFor="lamination" className="block text-sm font-medium text-slate-700">Acabado</label>
                    <select name="lamination" id="lamination" value={config.lamination} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                        {Object.values(LaminationType).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
};

export default ConfigurationPanel;
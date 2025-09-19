import React, { useState, useEffect } from 'react';
import { DesignConfig, ProductionMode, LaminationType, CutShape, MimakiInputMode } from '../types';
import { VectorizeIcon, InfoIcon, ArrowDownIcon } from './Icons';

interface ConfigurationPanelProps {
    config: DesignConfig;
    onConfigChange: (newConfig: Partial<DesignConfig>) => void;
    onVectorize: () => void;
    isVectorizing: boolean;
    onRemoveBackground: () => void;
    isRemovingBackground: boolean;
    imageLoaded: boolean;
}

const productionModes = [
    { 
        mode: ProductionMode.XEROX, 
        name: "Xerox", 
        desc: "Prensa Digital",
        img: "https://cdn.shopify.com/s/files/1/0630/1646/8614/files/Gemini_Generated_Image_hhsqsdhhsqsdhhsq.png?v=1758256727"
    },
    { 
        mode: ProductionMode.PLOTTER_EPSON, 
        name: "Plotter EPSON", 
        desc: "Impresión INKjet",
        img: "https://cdn.shopify.com/s/files/1/0630/1646/8614/files/Gemini_Generated_Image_tkk6u5tkk6u5tkk6.png?v=1758256727"
    },
    { 
        mode: ProductionMode.MIMAKI_DTF_UV, 
        name: "Mimaki 75", 
        desc: "DTF-UV",
        img: "https://cdn.shopify.com/s/files/1/0630/1646/8614/files/Gemini_Generated_Image_q226nsq226nsq226.png?v=1758256729"
    },
    { 
        mode: ProductionMode.MIMAKI_HOLO_UV, 
        name: "Mimaki 75", 
        desc: "HOLO-UV",
        img: "https://cdn.shopify.com/s/files/1/0630/1646/8614/files/Gemini_Generated_Image_jiokd2jiokd2jiok.png?v=1758256727"
    },
];

const cmykToRgb = (c: number, m: number, y: number, k: number): string => {
    const r = 255 * (1 - c / 100) * (1 - k / 100);
    const g = 255 * (1 - m / 100) * (1 - k / 100);
    const b = 255 * (1 - y / 100) * (1 - k / 100);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
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
    const [showColorOptions, setShowColorOptions] = useState(false);
    const [cmykValues, setCmykValues] = useState({ c: 0, m: 0, y: 0, k: 0 });
    
    useEffect(() => {
        // Sync local CMYK state if global config changes (e.g., loading a design)
        const parts = config.cmykColor.split(',').map(Number);
        if (parts.length === 4) {
            setCmykValues({ c: parts[0], m: parts[1], y: parts[2], k: parts[3] });
        }
    }, [config.cmykColor]);

    const handleCmykChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newValues = { ...cmykValues, [name]: Math.max(0, Math.min(100, Number(value))) };
        setCmykValues(newValues);
        const newCmykString = `${newValues.c},${newValues.m},${newValues.y},${newValues.k}`;
        const newRgb = cmykToRgb(newValues.c, newValues.m, newValues.y, newValues.k);
        onConfigChange({ backgroundColor: newRgb, cmykColor: newCmykString });
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            onConfigChange({ [name]: checked });
            return;
        }

        const numericValue = ['quantity', 'width', 'height', 'cornerRadius', 'stickerSpacing', 'linearLengthCm'].includes(name) ? parseFloat(value) : value;
        onConfigChange({ [name]: numericValue });
    };

    const handleSaveConfig = () => {
        try {
            // Perform a pre-serialization check to catch potential issues
            JSON.stringify(config); 
            localStorage.setItem('stickerDesignerConfig', JSON.stringify(config));
            alert('¡Configuración guardada exitosamente!');
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
            alert('Error: No se pudo guardar la configuración. El objeto de configuración podría no ser válido.');
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
            localStorage.removeItem('stickerDesignerConfig'); // Clear corrupted data
            alert('Error: No se pudo cargar la configuración. Puede que esté corrupta y ha sido eliminada.');
        }
    };
    
    const calculateSliderCost = (cm: number) => {
        if (cm <= 0) return 0;
        if (cm > 70) return 700;
        return Math.ceil(cm / 10) * 100;
    };

    const BRAND_COLORS = ['#FFFFFF', '#18181b', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899'];
    const isMimakiDTF = config.mode === ProductionMode.MIMAKI_DTF_UV;
    const isMimakiHolo = config.mode === ProductionMode.MIMAKI_HOLO_UV;
    const isAnyMimaki = isMimakiDTF || isMimakiHolo;
    const isMimakiLengthMode = isMimakiDTF && config.mimakiInputMode === MimakiInputMode.LENGTH;
    const sliderCost = calculateSliderCost(config.linearLengthCm);
    
    return (
        <div className="p-5 bg-white rounded-2xl shadow-lg border border-slate-200 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Técnica y Equipo de Impresión</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 [perspective:1000px]">
                    {productionModes.map(pm => (
                        <button 
                            key={pm.mode} 
                            onClick={() => onConfigChange({ mode: pm.mode })} 
                            className={`text-left p-2.5 rounded-lg border-2 transition-all duration-300 transform-gpu hover:scale-[1.03] hover:-rotate-y-3 hover:rotate-x-2 hover:shadow-2xl ${config.mode === pm.mode ? 'border-cyan-500 ring-2 ring-cyan-500/50 shadow-lg' : 'border-slate-200 hover:border-cyan-400'}`}
                        >
                            <img src={pm.img} alt={pm.name} className="w-full h-20 object-cover rounded-md mb-2"/>
                            <p className="font-semibold text-sm text-slate-800">{pm.name}</p>
                            <p className="text-xs text-slate-500">{pm.desc}</p>
                        </button>
                    ))}
                </div>
                 {config.mode && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        {isAnyMimaki ? "Impresión CMYK + Tinta Blanca + Barniz para efectos y aplicación sobre cualquier superficie." : "Impresión estándar CMYK de alta calidad."}
                    </div>
                )}
            </div>

            {config.mode && (
                <div className="space-y-6 animate-fade-in">
                     <div className="flex justify-center items-center text-slate-300">
                        <ArrowDownIcon className="w-6 h-6 animate-bounce"/>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">2. Define tu Pedido</h2>
                    
                    {isAnyMimaki && (
                        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                            <p className="font-bold">¡Atención: Material Especial!</p>
                            <p className="text-sm">Este material es sensible a la luz solar y frágil. Se recomienda añadir el contenedor de cartón para su protección. <br/><strong>Requiere una imagen de 300ppp a tamaño real.</strong></p>
                        </div>
                    )}
                    
                    {isMimakiDTF && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Calcular por</label>
                            <div className="flex rounded-md shadow-sm" role="group">
                                <button
                                    type="button"
                                    onClick={() => onConfigChange({ mimakiInputMode: MimakiInputMode.QUANTITY })}
                                    className={`px-4 py-2 text-sm font-medium border border-slate-300 rounded-l-lg transition-colors ${config.mimakiInputMode === MimakiInputMode.QUANTITY ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    Cantidad
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onConfigChange({ mimakiInputMode: MimakiInputMode.LENGTH })}
                                    className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-slate-300 rounded-r-lg transition-colors ${config.mimakiInputMode === MimakiInputMode.LENGTH ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    Largo (cm)
                                </button>
                            </div>
                        </div>
                    )}

                    {isMimakiHolo && (
                        <div>
                            <label htmlFor="linearLengthCm" className="block text-sm font-medium text-slate-700">Largo por Metro (m)</label>
                            <input type="number" name="linearLengthCm" id="linearLengthCm" value={config.linearLengthCm / 100} onChange={(e) => onConfigChange({ linearLengthCm: parseFloat(e.target.value) * 100 })} min="1" step="1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            <p className="text-xs text-slate-500 mt-1">Este producto se vende por metro. Introduce la cantidad de metros que necesitas.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isMimakiHolo && (
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Cantidad Total</label>
                            <input type="number" name="quantity" id="quantity" value={config.quantity} onChange={handleInputChange} min="1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-slate-100" disabled={isMimakiLengthMode}/>
                        </div>
                        )}
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
                    
                    {isMimakiLengthMode && (
                        <div>
                            <label htmlFor="linearLengthCm" className="block text-sm font-medium text-slate-700 mb-2">Largo Lineal (cm)</label>
                            <div className="relative pt-8">
                                <div 
                                    className="absolute bg-slate-800 text-white text-xs rounded-md py-1 px-2 pointer-events-none -top-0 transform -translate-x-1/2"
                                    style={{ left: `calc(${((config.linearLengthCm - 10) / 90) * 100}% + 12px)` }}
                                >
                                    <span className="font-bold">{config.linearLengthCm} cm</span> / ${sliderCost}
                                    <div className="absolute w-2 h-2 bg-slate-800 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                                </div>
                                <input
                                    type="range"
                                    name="linearLengthCm"
                                    id="linearLengthCm"
                                    min="10"
                                    max="100"
                                    step="1"
                                    value={config.linearLengthCm}
                                    onChange={handleInputChange}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>10 cm</span>
                                    <span>100 cm</span>
                                </div>
                            </div>
                        </div>
                    )}


                    {imageLoaded && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-center items-center text-slate-300">
                                <ArrowDownIcon className="w-6 h-6"/>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">3. Personaliza tu Sticker</h2>
                             <div>
                                {!showColorOptions ? (
                                     <button onClick={() => setShowColorOptions(true)} className="w-full text-left p-3 font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                                        Añadir Color de Fondo
                                    </button>
                                ) : (
                                <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-slate-700">Color de Fondo (CMYK)</label>
                                        <button onClick={() => setShowColorOptions(false)} className="text-xs text-slate-500 hover:text-slate-700">Cerrar</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div><label className="text-xs">C</label><input type="number" name="c" value={cmykValues.c} onChange={handleCmykChange} className="w-full rounded border-slate-300 text-sm p-1"/></div>
                                        <div><label className="text-xs">M</label><input type="number" name="m" value={cmykValues.m} onChange={handleCmykChange} className="w-full rounded border-slate-300 text-sm p-1"/></div>
                                        <div><label className="text-xs">Y</label><input type="number" name="y" value={cmykValues.y} onChange={handleCmykChange} className="w-full rounded border-slate-300 text-sm p-1"/></div>
                                        <div><label className="text-xs">K</label><input type="number" name="k" value={cmykValues.k} onChange={handleCmykChange} className="w-full rounded border-slate-300 text-sm p-1"/></div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Nota: El color en pantalla es una aproximación RGB.
                                    </p>
                                    <div className="flex justify-end">
                                        <button type="button" className="px-3 py-1 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-100" onClick={() => onConfigChange({ backgroundColor: null })}>
                                            Transparente
                                        </button>
                                    </div>
                                </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="shape" className="block text-sm font-medium text-slate-700">Forma de Corte</label>
                                <select name="shape" id="shape" value={config.shape} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                    {Object.values(CutShape).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
                                <h3 className="text-sm font-semibold text-slate-600">Herramientas con IA</h3>
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

                            {isAnyMimaki && (
                                <div>
                                    <label htmlFor="stickerSpacing" className="flex items-center text-sm font-medium text-slate-700">
                                        Medianil (0-10mm)
                                        <div className="relative group ml-2">
                                            <InfoIcon className="w-4 h-4 text-slate-400"/>
                                            <div className="absolute bottom-full mb-2 w-48 bg-slate-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Espacio entre stickers para facilitar el corte. Recomendamos 5mm.
                                            </div>
                                        </div>
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input type="range" name="stickerSpacing" id="stickerSpacing" value={config.stickerSpacing} onChange={handleInputChange} min="0" max="10" step="1" className="mt-1 block w-full"/>
                                        <input type="number" value={config.stickerSpacing} onChange={handleInputChange} name="stickerSpacing" min="0" max="10" className="w-20 mt-1 rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"/>
                                    </div>
                                </div>
                            )}
                            
                            {config.mode === ProductionMode.XEROX && (
                                <div>
                                    <label htmlFor="lamination" className="block text-sm font-medium text-slate-700">Acabado</label>
                                    <select name="lamination" id="lamination" value={config.lamination} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                        {Object.values(LaminationType).map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            )}

                            {isMimakiDTF && (
                                <div className="p-3 bg-slate-50 rounded-lg border">
                                    <label className="flex items-center">
                                        <input type="checkbox" name="container" checked={config.container} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"/>
                                        <span className="ml-2 text-sm text-slate-700">Añadir contenedor de cartón (+ $100.00)</span>
                                    </label>
                                </div>
                            )}
                            
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
                                        Cambiar Diseño
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConfigurationPanel;
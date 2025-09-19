import React from 'react';
import { ImageInfo, DesignConfig, CutShape, ProductionMode } from '../types';

interface PreviewProps {
    image: ImageInfo;
    config: DesignConfig;
    onPreviewClick: () => void;
}

const HolographicOverlay: React.FC = () => (
    <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-overlay"
        style={{
            background: 'linear-gradient(135deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
            backgroundSize: '400% 400%',
            animation: 'holo-gradient 10s ease infinite',
        }}
    >
        <style>
        {`
            @keyframes holo-gradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `}
        </style>
    </div>
);

const Preview: React.FC<PreviewProps> = ({ image, config, onPreviewClick }) => {
    if (!image) return null;

    const { width, height, shape, cornerRadius, cutPath, backgroundColor, mode } = config;
    const aspectRatio = image.width / image.height;
    
    // Convert cm to mm for consistency in scaling
    const itemW = width * 10;
    const itemH = height * 10;
    
    // Scale cornerRadius from mm to viewBox units (0-100).
    const scaledRadius = (cornerRadius / Math.max(itemW, itemH)) * 100;
    const isHolo = mode === ProductionMode.MIMAKI_HOLO_UV;

    return (
        <div 
            className="w-full bg-white p-5 rounded-2xl shadow-lg border border-slate-200 cursor-pointer group"
            onClick={onPreviewClick}
            title="Haz clic para ver un mockup del producto"
        >
            <h3 className="text-lg font-bold text-slate-800 mb-2">Previsualización del Sticker</h3>
            <div className="relative w-full overflow-hidden rounded-md transition-shadow group-hover:shadow-lg" style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}>
                <div 
                    className="absolute inset-0 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: backgroundColor || 'transparent' }}
                >
                    <img src={image.src} alt="Sticker Preview" className="max-w-full max-h-full object-contain z-0" />
                    
                    {isHolo && <HolographicOverlay />}

                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio={"none"}
                        className="absolute inset-0 w-full h-full z-10"
                    >
                        {shape === CutShape.SQUARE && (
                            <rect x="0" y="0" width="100" height="100" fill="none" stroke="#06b6d4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
                        )}
                        {shape === CutShape.ROUNDED_SQUARE && (
                            <rect x="0" y="0" width="100" height="100" rx={scaledRadius} ry={scaledRadius} fill="none" stroke="#06b6d4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
                        )}
                         {shape === CutShape.CIRCLE && (
                            <ellipse cx="50" cy="50" rx="50" ry="50" fill="none" stroke="#06b6d4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
                        )}
                        {shape === CutShape.CONTOUR && cutPath && (
                            <path d={cutPath} fill="none" stroke="#06b6d4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Preview;

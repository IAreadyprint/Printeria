
import React from 'react';
import { ImageInfo, DesignConfig, CutShape } from '../types';

interface PreviewProps {
    image: ImageInfo;
    config: DesignConfig;
}

const Preview: React.FC<PreviewProps> = ({ image, config }) => {
    if (!image) return null;

    const { width, height, shape, cornerRadius, cutPath, backgroundColor } = config;
    const aspectRatio = image.width / image.height;
    
    // Convert cm to mm for consistency in scaling
    const itemW = width * 10;
    const itemH = height * 10;
    
    // Scale cornerRadius from mm to viewBox units (0-100).
    const scaledRadius = (cornerRadius / Math.max(itemW, itemH)) * 100;

    return (
        <div className="w-full bg-slate-100 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Previsualización del Sticker</h3>
            <div className="relative w-full" style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}>
                <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: backgroundColor || 'transparent' }}
                >
                    <img src={image.src} alt="Sticker Preview" className="max-w-full max-h-full object-contain" />

                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio={"none"}
                        className="absolute inset-0 w-full h-full"
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
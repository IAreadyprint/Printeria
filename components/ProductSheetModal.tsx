import React from 'react';
import Modal from './Modal';
import { DesignConfig, ImageInfo, CutShape, LaminationType } from '../types';

interface ProductSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: DesignConfig;
    image: ImageInfo | null;
}

const ProductSheetModal: React.FC<ProductSheetModalProps> = ({ isOpen, onClose, config, image }) => {
    if (!isOpen || !image) {
        return null;
    }

    const { shape, cornerRadius, width, height, lamination, backgroundColor } = config;

    const getShapeStyles = () => {
        // Use a large base size for the modal preview (e.g., 400px)
        const previewSize = 400; 
        // Calculate corner radius relative to the preview size
        const cornerRadiusValue = (cornerRadius / (width * 10)) * previewSize;

        switch (shape) {
            case CutShape.ROUNDED_SQUARE:
                return { borderRadius: `${cornerRadiusValue}px` };
            case CutShape.CIRCLE:
                return { borderRadius: '50%' };
            case CutShape.SQUARE:
            case CutShape.CONTOUR: // Contour is displayed in a rect, art shows the shape
            default:
                return { borderRadius: '0px' };
        }
    };
    
    const stickerStyle: React.CSSProperties = {
        width: '400px',
        height: '400px',
        transform: 'perspective(1000px) rotateX(10deg) rotateY(-10deg) rotateZ(3deg)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.1) inset',
        overflow: 'hidden',
        position: 'relative',
        backfaceVisibility: 'hidden',
        backgroundColor: backgroundColor || 'transparent',
        ...getShapeStyles()
    };
    
    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        transform: 'translateZ(0)', // Promotes to a new layer for better performance
    };

    if (lamination === LaminationType.MATTE) {
        imageStyle.filter = 'saturate(90%) brightness(98%)';
    }


    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl">
                 <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Vista Previa del Producto</h2>
                
                <div className="flex justify-center items-center h-[450px]">
                    <div style={stickerStyle}>
                         <img 
                            src={image.src} 
                            alt="Diseño del sticker"
                            style={imageStyle}
                        />
                        {/* Lamination Effects */}
                        {lamination === LaminationType.GLOSS && (
                            <div 
                                className="absolute inset-0 w-full h-full pointer-events-none" 
                                style={{
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.7) 15%, rgba(255,255,255,0.15) 50%, transparent 65%)',
                                    transform: 'skewX(-20deg) translateX(-45%)',
                                    boxShadow: 'inset 0 0 25px 10px rgba(255, 255, 255, 0.2)',
                                    mixBlendMode: 'plus-lighter',
                                    opacity: 0.8
                                }}
                            />
                        )}
                         {lamination === LaminationType.MATTE && (
                            <div 
                                className="absolute inset-0 w-full h-full pointer-events-none" 
                                style={{
                                    // Subtle noise texture
                                    backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXVpaWlrasLLyspfX19sbGxhYWFiYmJjY2NxcXFiYmJjY2NgyJPm483Y3svU2sri4s_e4M7R2s_o5s5A/1A/AAAAL0lEQVRId/3VsQEAMAwDQREDr/wV28eEgIFoGkHPmbwV4e8yV1e11pI1UjNlPZfzkzNPAo8GQAD4JgE2AAAAAElFTkSuQmCC)',
                                    mixBlendMode: 'overlay',
                                    opacity: 0.25,
                                }}></div>
                        )}

                    </div>
                </div>

                 <div className="mt-6 text-center">
                    <p className="text-slate-600">Este es un mockup digital para representar el producto final.</p>
                </div>
            </div>
        </Modal>
    );
};

export default ProductSheetModal;
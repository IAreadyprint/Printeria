import React from 'react';

interface CustomCursorProps {
    position: { x: number; y: number };
    variant: 'default' | 'hover';
}

const CustomCursor: React.FC<CustomCursorProps> = ({ position, variant }) => {
    const variants = {
        default: {
            outline: {
                scale: 1,
                opacity: 1,
                backgroundColor: 'transparent',
                borderColor: '#0891b2', // cyan-600
            },
        },
        hover: {
            outline: {
                scale: 1.5,
                opacity: 0.5,
                backgroundColor: 'rgba(6, 182, 212, 0.2)', // cyan-500 with alpha
                borderColor: '#0e7490', // cyan-700
            },
        }
    };

    const currentVariant = variants[variant] || variants.default;

    const cursorStyle: React.CSSProperties = {
        position: 'fixed',
        top: position.y,
        left: position.x,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-50%, -50%)',
    };

    const dotStyle: React.CSSProperties = {
        ...cursorStyle,
        width: '8px',
        height: '8px',
        backgroundColor: '#06b6d4', // cyan-500
        borderRadius: '50%',
        transition: 'transform 0.1s ease-out',
    };

    const outlineStyle: React.CSSProperties = {
        ...cursorStyle,
        width: '32px',
        height: '32px',
        border: `2px solid ${currentVariant.outline.borderColor}`,
        borderRadius: '50%',
        transition: 'transform 0.2s ease-out, opacity 0.2s, background-color 0.2s, border-color 0.2s',
        transform: `translate(-50%, -50%) scale(${currentVariant.outline.scale})`,
        opacity: currentVariant.outline.opacity,
        backgroundColor: currentVariant.outline.backgroundColor,
    };

    return (
        <>
            <div style={outlineStyle} />
            <div style={dotStyle} />
        </>
    );
};

export default CustomCursor;

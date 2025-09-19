import React from 'react';
import { DesignConfig, ProductionMode, CutShape, ImageInfo, LayoutInfo } from '../types';

interface ImpositionPreviewProps {
    config: DesignConfig;
    image: ImageInfo | null;
    layout: LayoutInfo;
}

const SHEET_TEMPLATES = {
    [ProductionMode.XEROX]: {
        width: 330, height: 480, printableWidth: 300, printableHeight: 420,
        printableX: 15, printableY: 45,
        markLength: 10, 
        name: 'Planilla Xerox (33x48 cm)'
    },
    [ProductionMode.PLOTTER_EPSON]: {
        width: 600, height: 1500, printableWidth: 500, printableHeight: 1400,
        printableX: 50, printableY: 50,
        markLength: 10,
        name: 'Pliego Plotter EPSON (60x150 cm)'
    },
    [ProductionMode.MIMAKI_DTF_UV]: {
        width: 600, height: 2000, printableWidth: 580, printableHeight: 2000,
        printableX: 10, printableY: 10,
        markLength: 0,
        name: 'Rollo Mimaki DTF UV (60 cm ancho)'
    },
    [ProductionMode.MIMAKI_HOLO_UV]: {
        width: 600, height: 2000, printableWidth: 580, printableHeight: 2000,
        printableX: 10, printableY: 10,
        markLength: 0,
        name: 'Rollo Mimaki HOLO UV (60 cm ancho)'
    }
};

const RegistrationMarks: React.FC<{ mode: ProductionMode }> = ({ mode }) => {
    if (mode === ProductionMode.MIMAKI_DTF_UV || mode === ProductionMode.MIMAKI_HOLO_UV) return null;

    const template = SHEET_TEMPLATES[mode];
    const { printableX, printableY, printableWidth, printableHeight, markLength } = template;
    const markColor = "black";
    const markStrokeWidth = 0.5;
    const printableRight = printableX + printableWidth;
    const printableBottom = printableY + printableHeight;

    const cornerMarks = [
        <path key="tl" d={`M ${printableX - markLength},${printableY} H ${printableX} V ${printableY - markLength}`} />,
        <path key="tr" d={`M ${printableRight + markLength},${printableY} H ${printableRight} V ${printableY - markLength}`} />,
        <path key="bl" d={`M ${printableX - markLength},${printableBottom} H ${printableX} V ${printableBottom + markLength}`} />,
        <path key="br" d={`M ${printableRight + markLength},${printableBottom} H ${printableRight} V ${printableBottom + markLength}`} />
    ];

    const plotterIntermediateMarks = () => {
        if (mode !== ProductionMode.PLOTTER_EPSON) return [];
        
        const y1 = printableY + printableHeight / 3;
        const y2 = printableY + 2 * printableHeight / 3;
        
        return [
            <g key="im-l" transform={`translate(${printableX}, ${y1})`}><path d="M -10,0 H 0" /><path d="M 0,-5 V 5" /></g>,
            <g key="im-l2" transform={`translate(${printableX}, ${y2})`}><path d="M -10,0 H 0" /><path d="M 0,-5 V 5" /></g>,
            <g key="im-r" transform={`translate(${printableRight}, ${y1})`}><path d="M 10,0 H 0" /><path d="M 0,-5 V 5" /></g>,
            <g key="im-r2" transform={`translate(${printableRight}, ${y2})`}><path d="M 10,0 H 0" /><path d="M 0,-5 V 5" /></g>,
        ];
    };

    return <g id="registration-marks" stroke={markColor} strokeWidth={markStrokeWidth} fill="none">{[...cornerMarks, ...plotterIntermediateMarks()]}</g>;
};


const ImpositionPreview: React.FC<ImpositionPreviewProps> = ({ config, layout }) => {
    if (!config.mode) return null;
    const template = SHEET_TEMPLATES[config.mode];
    const isMimaki = config.mode === ProductionMode.MIMAKI_DTF_UV || config.mode === ProductionMode.MIMAKI_HOLO_UV;
    const term = config.mode === ProductionMode.XEROX ? 'Planilla' : (config.mode === ProductionMode.PLOTTER_EPSON ? 'Pliego' : 'Rollo');
    const { stickersPerSheet } = layout;
    const { bestLayout } = layout;
    const STICKER_SPACING = isMimaki ? config.stickerSpacing : 2;

    const totalBlockWidth = bestLayout.cols * bestLayout.itemW + (bestLayout.cols > 1 ? (bestLayout.cols - 1) * STICKER_SPACING : 0);
    const totalBlockHeight = bestLayout.rows * bestLayout.itemH + (bestLayout.rows > 1 ? (bestLayout.rows - 1) * STICKER_SPACING : 0);
    const xOffset = (template.printableWidth - totalBlockWidth) / 2;
    const yOffset = isMimaki ? 0 : (template.printableHeight - totalBlockHeight) / 2;

    // For Mimaki, preview the first 200cm, for others, the full sheet.
    const previewHeight = isMimaki ? Math.min(totalBlockHeight + template.printableY*2, template.height) : template.height;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Vista Previa de {term}</h3>
            <p className="text-slate-500 mb-4">{template.name}.</p>
            
            <div 
                className={`p-2 bg-gray-200 rounded-lg overflow-auto border`}
            >
                <svg
                    width="100%"
                    viewBox={`0 0 ${template.width} ${previewHeight}`}
                    className="bg-white shadow-inner"
                    style={{ aspectRatio: `${template.width}/${previewHeight}`}}
                >
                    <rect 
                        x={template.printableX}
                        y={template.printableY}
                        width={template.printableWidth}
                        height={isMimaki ? totalBlockHeight : template.printableHeight}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                    />
                    <RegistrationMarks mode={config.mode} />
                    {stickersPerSheet > 0 && Array.from({ length: bestLayout.rows }).map((_, r) => (
                        Array.from({ length: bestLayout.cols }).map((_, c) => {
                            const x = template.printableX + xOffset + c * (bestLayout.itemW + STICKER_SPACING);
                            const y = template.printableY + yOffset + r * (bestLayout.itemH + STICKER_SPACING);
                            
                             let shapeElement;
                            const shapeProps = {
                                fill: "rgba(22, 163, 175, 0.2)",
                                stroke: "rgba(22, 163, 175, 0.5)",
                                strokeWidth: "0.5"
                            };

                            switch(config.shape) {
                                case CutShape.ROUNDED_SQUARE:
                                    shapeElement = <rect width={bestLayout.itemW} height={bestLayout.itemH} rx={config.cornerRadius} ry={config.cornerRadius} {...shapeProps} />;
                                    break;
                                case CutShape.CIRCLE:
                                    shapeElement = <ellipse cx={bestLayout.itemW / 2} cy={bestLayout.itemH / 2} rx={bestLayout.itemW / 2} ry={bestLayout.itemH / 2} {...shapeProps} />;
                                    break;
                                case CutShape.CONTOUR:
                                    if (config.cutPath) {
                                        const scaleX = bestLayout.itemW / 100;
                                        const scaleY = bestLayout.itemH / 100;
                                        shapeElement = <path d={config.cutPath} transform={`scale(${scaleX} ${scaleY})`} {...shapeProps} />;
                                    } else {
                                        shapeElement = <rect width={bestLayout.itemW} height={bestLayout.itemH} {...shapeProps} />;
                                    }
                                    break;
                                case CutShape.SQUARE:
                                default:
                                    shapeElement = <rect width={bestLayout.itemW} height={bestLayout.itemH} {...shapeProps} />;
                            }
                            // Don't render shapes outside the preview box for performance
                            if(y > previewHeight) return null;
                            
                            return <g key={`${r}-${c}`} transform={`translate(${x}, ${y})`}>{shapeElement}</g>;
                        })
                    ))}
                </svg>
            </div>
             <p className="text-xs text-slate-500 mt-2 text-center">La vista previa es una representación a escala del primer {term.toLowerCase()}.</p>
        </div>
    );
};
export default ImpositionPreview;

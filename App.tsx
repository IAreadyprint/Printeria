import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ConfigurationPanel from './components/ConfigurationPanel';
import Preview from './components/Preview';
import SummaryPanel from './components/SummaryPanel';
import InspirationGallery from './components/InspirationGallery';
import { generateCutPath, removeBackground } from './services/geminiService';
import { ImageInfo, DesignConfig, CutShape, ProductionMode, LaminationType, LayoutInfo, MimakiInputMode } from './types';
import DownloadInfoModal from './components/DownloadInfoModal';
import ImpositionPreview from './components/ImpositionPreview';
import ProductSheetModal from './components/ProductSheetModal';
import CustomCursor from './components/CustomCursor';
import BackgroundRemovalTool from './components/BackgroundRemovalTool';
import EmailModal from './components/EmailModal';


const SHEET_TEMPLATES = {
    [ProductionMode.XEROX]: { width: 330, height: 480, printableWidth: 300, printableHeight: 420, printableX: 15, printableY: 45, markLength: 10, markStroke: 0.05 },
    [ProductionMode.PLOTTER_EPSON]: { width: 600, height: 1500, printableWidth: 500, printableHeight: 1400, printableX: 50, printableY: 50, markLength: 10, markStroke: 0.05 },
    [ProductionMode.MIMAKI_DTF_UV]: { width: 600, height: 2000, printableWidth: 580, printableHeight: 2000, printableX: 10, printableY: 10, markLength: 0, markStroke: 0 },
    [ProductionMode.MIMAKI_HOLO_UV]: { width: 600, height: 2000, printableWidth: 580, printableHeight: 2000, printableX: 10, printableY: 10, markLength: 0, markStroke: 0 },
};

const INSPIRATION_VIDEOS_RAW = [
    "https://cdn.shopify.com/videos/c/o/v/dcfe3464bc654b05ba2c7d7be586d766.mp4",
    "https://cdn.shopify.com/videos/c/o/v/6fca98c44f214decaa5f209438e8afb2.mp4",
    "https://cdn.shopify.com/videos/c/o/v/4c77ef947a2846648b459e24363740ba.mp4",
    "https://cdn.shopify.com/videos/c/o/v/81029ccc153f4965a67cfabb240a22cc.mp4",
    "https://cdn.shopify.com/videos/c/o/v/3236f3af01d242f2b45b3d7fb0e71022.mp4",
    "https://cdn.shopify.com/videos/c/o/v/bba2d02fbd984283b0c891f02198968a.mp4",
    "https://cdn.shopify.com/videos/c/o/v/5c3a46a762a144b7aa72d49b59c6bee8.mp4",
    "https://cdn.shopify.com/videos/c/o/v/a812fe896e0a419aa6029d7858e51938.mp4",
    "https://cdn.shopify.com/videos/c/o/v/21be5e6476524050a48006d0429b7567.mp4",
    "https://cdn.shopify.com/videos/c/o/v/a4145db8bd66423db639ca138ea50697.mp4",
    "https://cdn.shopify.com/videos/c/o/v/05fba39e46514e5dbb74fab7ca0de50c.mp4",
    "https://cdn.shopify.com/videos/c/o/v/6ca3cf51f0d542208b8d9ef41b8172dc.mp4",
    "https://cdn.shopify.com/videos/c/o/v/235e1a5509234b558e35feef485869b0.mp4",
    "https://cdn.shopify.com/videos/c/o/v/8a884c54e3314fc7aa2cb8a44c344001.mp4",
    "https://cdn.shopify.com/videos/c/o/v/645bb3339bc34ae19ab854f2231cae39.mp4",
    "https://cdn.shopify.com/videos/c/o/v/93a44b8dd1114ccbaab2bccba59ea55a.mp4",
    "https://cdn.shopify.com/videos/c/o/v/ddc51f7c6705402f9fcfebc515c5994e.mp4",
    "https://cdn.shopify.com/videos/c/o/v/5ef9b634df1d4149bf0c6cd3faf62dc9.mp4"
];
const INSPIRATION_VIDEOS = [...new Set(INSPIRATION_VIDEOS_RAW)];


const calculateLayout = (config: DesignConfig): LayoutInfo => {
    const { width, height, quantity, mode, stickerSpacing } = config;
    if (!mode) {
        return { stickersPerSheet: 0, totalSheets: 0, bestLayout: { cols: 0, rows: 0, rotated: false, itemW: 0, itemH: 0 } };
    }
    const itemW = width * 10;
    const itemH = height * 10;
    const template = SHEET_TEMPLATES[mode];
    
    if (!width || !height || (!quantity && config.mimakiInputMode !== MimakiInputMode.LENGTH)) {
        return { stickersPerSheet: 0, totalSheets: 0, bestLayout: { cols: 0, rows: 0, rotated: false, itemW: 0, itemH: 0 } };
    }

    if (mode === ProductionMode.MIMAKI_DTF_UV || mode === ProductionMode.MIMAKI_HOLO_UV) {
        const spacing = stickerSpacing;
        const cols = itemW > 0 ? Math.floor((template.printableWidth + spacing) / (itemW + spacing)) : 0;
        if (cols === 0) {
            return { stickersPerSheet: 0, totalSheets: 0, bestLayout: { cols: 0, rows: 0, rotated: false, itemW: 0, itemH: 0 }, linearMeters: 0, totalStickersProduced: 0 };
        }
        
        let rowsNeeded: number;
        let totalStickersProduced: number;
        let linearHeightMm: number;

        if (config.mimakiInputMode === MimakiInputMode.LENGTH) {
            linearHeightMm = config.linearLengthCm * 10;
            rowsNeeded = itemH > 0 ? Math.floor((linearHeightMm + spacing) / (itemH + spacing)) : 0;
            totalStickersProduced = cols * rowsNeeded;
        } else { // By QUANTITY
            rowsNeeded = quantity > 0 ? Math.ceil(quantity / cols) : 0;
            totalStickersProduced = cols * rowsNeeded;
            linearHeightMm = rowsNeeded * itemH + Math.max(0, rowsNeeded - 1) * spacing;
        }

        const linearMeters = linearHeightMm / 1000;
        const totalSheets = Math.ceil(linearHeightMm / template.height); // Sheets of 200cm
        
        return {
            stickersPerSheet: cols, // On Mimaki, this represents stickers per row
            totalSheets,
            bestLayout: {
                cols,
                rows: rowsNeeded,
                rotated: false,
                itemW,
                itemH,
            },
            linearMeters,
            totalStickersProduced,
        };
    }

    // Existing logic for Xerox and Plotter
    const { printableWidth, printableHeight } = template;
    const STICKER_SPACING = 2; // mm

    const calculateFit = (itemWidth: number, itemHeight: number) => {
        if (itemWidth <= 0 || itemHeight <= 0) return 0;
        const cols = Math.floor((printableWidth + STICKER_SPACING) / (itemWidth + STICKER_SPACING));
        const rows = Math.floor((printableHeight + STICKER_SPACING) / (itemHeight + STICKER_SPACING));
        return cols * rows;
    };

    const fitNormal = calculateFit(itemW, itemH);
    const fitRotated = calculateFit(itemH, itemW);

    const stickersPerSheet = Math.max(fitNormal, fitRotated);
    if (stickersPerSheet === 0) {
        return { stickersPerSheet: 0, totalSheets: 0, bestLayout: { cols: 0, rows: 0, rotated: false, itemW: 0, itemH: 0 } };
    }
    
    const totalSheets = Math.ceil(quantity / stickersPerSheet);
    const rotated = fitRotated > fitNormal;
    const finalItemW = rotated ? itemH : itemW;
    const finalItemH = rotated ? itemW : itemH;

    const bestLayout = {
        cols: Math.floor((printableWidth + STICKER_SPACING) / (finalItemW + STICKER_SPACING)),
        rows: Math.floor((printableHeight + STICKER_SPACING) / (finalItemH + STICKER_SPACING)),
        rotated,
        itemW: finalItemW,
        itemH: finalItemH,
    };
    
    return { stickersPerSheet, totalSheets, bestLayout };
};


function App() {
  const [image, setImage] = useState<ImageInfo | null>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMimakiInfoModal, setShowMimakiInfoModal] = useState(false);
  const [isProductSheetModalOpen, setIsProductSheetModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });
  const [cursorVariant, setCursorVariant] = useState<'default' | 'hover'>('default');
  
  const [config, setConfig] = useState<DesignConfig>({
    quantity: 100,
    width: 4,
    height: 4,
    shape: CutShape.SQUARE,
    cornerRadius: 5,
    mode: null,
    lamination: LaminationType.NONE,
    cutPath: null,
    backgroundColor: null,
    cmykColor: "0,0,0,0",
    stickerSpacing: 5, // Default for Mimaki
    container: false, // Default for Mimaki
    mimakiInputMode: MimakiInputMode.QUANTITY,
    linearLengthCm: 10,
  });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setCursorPosition({ x: e.clientX, y: e.clientY });
            const target = e.target as HTMLElement;
            if (target.closest('a, button, input, select, [role="button"], [class*="cursor-pointer"]')) {
                setCursorVariant('hover');
            } else {
                setCursorVariant('default');
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

  const layout = useMemo(() => calculateLayout(config), [config]);
  
  const isConfigReady = config.mode && config.width > 0 && config.height > 0 && (config.quantity > 0 || config.mimakiInputMode === MimakiInputMode.LENGTH);
  const isReadyForQuote = isConfigReady && image !== null;
  const isAnyMimaki = config.mode === ProductionMode.MIMAKI_DTF_UV || config.mode === ProductionMode.MIMAKI_HOLO_UV;
  
  const quoteMessage = useMemo(() => {
        if (!isReadyForQuote) return '';
        
        const { stickersPerSheet, totalSheets, linearMeters, totalStickersProduced } = layout;
        const cmykText = config.backgroundColor ? `\n- Color de Fondo (CMYK): ${config.cmykColor}` : '';
        let productionDetails = '';
        let quantityText = `- Cantidad: ${config.quantity} stickers`;
        const isMimakiDTF = config.mode === ProductionMode.MIMAKI_DTF_UV;
        const isMimakiHolo = config.mode === ProductionMode.MIMAKI_HOLO_UV;

        if (isMimakiDTF || isMimakiHolo) {
             if (config.mimakiInputMode === MimakiInputMode.LENGTH) {
                if(isMimakiHolo) {
                    quantityText = `- Impresión por metro: ${config.linearLengthCm / 100}m (Aprox. ${totalStickersProduced} stickers)`;
                } else {
                    quantityText = `- Impresión por longitud: ${config.linearLengthCm} cm (Aprox. ${totalStickersProduced} stickers)`;
                }
            }
            productionDetails = `- Modo de Producción: ${config.mode}
- Medianil: ${config.stickerSpacing} mm
${isMimakiDTF ? `- Contenedor: ${config.container ? 'Sí' : 'No'}` : ''}
- Formación: Se requieren ${linearMeters?.toFixed(2)} metros lineales.`;
        } else {
            productionDetails = `- Modo de Producción: ${config.mode}
- Acabado: ${config.lamination}
- Formación: ${stickersPerSheet} por ${config.mode === ProductionMode.XEROX ? 'planilla' : 'pliego'}, ${totalSheets} en total.`;
        }

        return `¡Hola Printeria! Quisiera cotizar el siguiente pedido de stickers:
- Imagen: ${image?.file.name}
${quantityText}
- Medidas: ${config.width} x ${config.height} cm
- Forma de Corte: ${config.shape}${cmykText}
${productionDetails}

Gracias.
(Gestionado por Maia | GPT.)`;
    }, [config, image, layout, isReadyForQuote]);


  const handleFileChange = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // DPI validation for Mimaki
        if (config.mode === ProductionMode.MIMAKI_DTF_UV || config.mode === ProductionMode.MIMAKI_HOLO_UV) {
            const requiredWidthPx = (config.width / 2.54) * 300;
            const requiredHeightPx = (config.height / 2.54) * 300;
            if (img.width < requiredWidthPx || img.height < requiredHeightPx) {
                setError(`¡Atención! La imagen tiene ${img.width}x${img.height}px pero se recomiendan ${Math.round(requiredWidthPx)}x${Math.round(requiredHeightPx)}px para una calidad óptima de 300ppp. Puedes continuar, pero la calidad podría ser inferior.`);
            }
        }

        setImage({
          file,
          src: e.target?.result as string,
          width: img.width,
          height: img.height,
        });
        setConfig(prev => ({...prev, cutPath: null})); // Reset cut path on new image
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfigChange = useCallback((newConfig: Partial<DesignConfig>) => {
    setConfig(prev => {
      let updatedConfig = { ...prev, ...newConfig };
      if (newConfig.shape && newConfig.shape !== CutShape.CONTOUR) {
        updatedConfig.cutPath = null;
      }
      if (newConfig.width || newConfig.height || newConfig.mode) {
        // Invalidate image if dimensions or mode change, to force re-upload and re-validation
        if(image) {
            setError(null);
            setImage(null);
        }
      }
      if (newConfig.mode) {
        // Reset specific settings when changing mode
        if (newConfig.mode === ProductionMode.MIMAKI_HOLO_UV) {
            updatedConfig.mimakiInputMode = MimakiInputMode.LENGTH;
            updatedConfig.linearLengthCm = 100; // Default to 1 meter
        } else if (newConfig.mode !== ProductionMode.MIMAKI_DTF_UV) {
            updatedConfig.mimakiInputMode = MimakiInputMode.QUANTITY;
        }
      }
      if (newConfig.backgroundColor === null) {
          updatedConfig.cmykColor = "0,0,0,0";
      }

      return updatedConfig;
    });
  }, [image]);

  const handleVectorize = async () => {
    if (!image) return;
    setIsVectorizing(true);
    setError(null);
    try {
      const path = await generateCutPath(image);
      if (path) {
        setConfig(prev => ({ ...prev, cutPath: path, shape: CutShape.CONTOUR }));
      } else {
        setError("No se pudo generar el contorno. Intenta con otra imagen o ajusta la configuración.");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al comunicarse con el servicio de IA.");
    } finally {
      setIsVectorizing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!image) return;
    setIsRemovingBackground(true);
    setError(null);
    try {
      const result = await removeBackground(image);
      if (result) {
        const newSrc = `data:${result.mimeType};base64,${result.data}`;
        const blob = await (await fetch(newSrc)).blob();
        const newFile = new File([blob], "background_removed.png", { type: result.mimeType });
        const img = new Image();
        img.onload = () => {
            setImage({
                file: newFile,
                src: newSrc,
                width: img.width,
                height: img.height,
            });
            setConfig(prev => ({ ...prev, cutPath: null })); // Invalidate old cut path
        };
        img.src = newSrc;
      } else {
        setError("No se pudo quitar el fondo de la imagen.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al procesar la imagen con la IA.");
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const generateRegMarksString = (mode: ProductionMode) => {
    if (mode === ProductionMode.MIMAKI_DTF_UV || mode === ProductionMode.MIMAKI_HOLO_UV) return ''; // No marks for Mimaki
    
    const template = SHEET_TEMPLATES[mode];
    const { printableX, printableY, printableWidth, printableHeight, markLength, markStroke } = template;
    const printableRight = printableX + printableWidth;
    const printableBottom = printableY + printableHeight;

    const cornerMarks = `
      <path d="M${printableX - markLength},${printableY} H${printableX} V${printableY - markLength}" />
      <path d="M${printableRight + markLength},${printableY} H${printableRight} V${printableY - markLength}" />
      <path d="M${printableX - markLength},${printableBottom} H${printableX} V${printableBottom + markLength}" />
      <path d="M${printableRight + markLength},${printableBottom} H${printableRight} V${printableBottom + markLength}" />
    `;
    
    if (mode === ProductionMode.PLOTTER_EPSON) {
      const y1 = printableY + printableHeight / 3;
      const y2 = printableY + 2 * printableHeight / 3;
      const plotterMarks = `
        <g transform="translate(${printableX}, ${y1})"><path d="M-${markLength},0 H 0" /><path d="M0,-5 V5" /></g>
        <g transform="translate(${printableX}, ${y2})"><path d="M-${markLength},0 H 0" /><path d="M0,-5 V5" /></g>
        <g transform="translate(${printableRight}, ${y1})"><path d="M${markLength},0 H 0" /><path d="M0,-5 V5" /></g>
        <g transform="translate(${printableRight}, ${y2})"><path d="M${markLength},0 H 0" /><path d="M0,-5 V5" /></g>
      `;
      return `<g id="registration-marks" stroke="black" stroke-width="${markStroke}" fill="none">${cornerMarks}${plotterMarks}</g>`;
    }

    return `<g id="registration-marks" stroke="black" stroke-width="${markStroke}" fill="none">${cornerMarks}</g>`;
  };

  const generateImpositionSvg = (type: 'print' | 'cut'): string => {
    if (!image || !layout.bestLayout.cols || !config.mode) return '';
    
    const template = SHEET_TEMPLATES[config.mode];
    const { bestLayout } = layout;
    const isMimaki = config.mode === ProductionMode.MIMAKI_DTF_UV || config.mode === ProductionMode.MIMAKI_HOLO_UV;
    const STICKER_SPACING = isMimaki ? config.stickerSpacing : 2;
    
    const totalBlockWidth = bestLayout.cols * bestLayout.itemW + (bestLayout.cols > 1 ? (bestLayout.cols - 1) * STICKER_SPACING : 0);
    const totalBlockHeight = bestLayout.rows * bestLayout.itemH + (bestLayout.rows > 1 ? (bestLayout.rows - 1) * STICKER_SPACING : 0);
    const xOffset = (template.printableWidth - totalBlockWidth) / 2;
    const yOffset = isMimaki ? 0 : (template.printableHeight - totalBlockHeight) / 2;
    
    const svgHeight = isMimaki ? (layout.linearMeters ?? 0) * 1000 + (template.printableY * 2) : template.height;

    let stickerShapeDef = '';
    const cutLineColor = "cyan";

    switch(config.shape) {
        case CutShape.ROUNDED_SQUARE:
            stickerShapeDef = `<rect id="cut-shape" width="${bestLayout.itemW}" height="${bestLayout.itemH}" rx="${config.cornerRadius}" ry="${config.cornerRadius}" fill="none" stroke="${cutLineColor}" stroke-width="0.05mm" />`;
            break;
        case CutShape.CIRCLE:
            stickerShapeDef = `<ellipse id="cut-shape" cx="${bestLayout.itemW / 2}" cy="${bestLayout.itemH / 2}" rx="${bestLayout.itemW / 2}" ry="${bestLayout.itemH / 2}" fill="none" stroke="${cutLineColor}" stroke-width="0.05mm" />`;
            break;
        case CutShape.CONTOUR:
             if (config.cutPath) {
                const scaleX = bestLayout.itemW / 100;
                const scaleY = bestLayout.itemH / 100;
                stickerShapeDef = `<path id="cut-shape" d="${config.cutPath}" transform="scale(${scaleX} ${scaleY})" fill="none" stroke="${cutLineColor}" stroke-width="0.05mm" />`;
            } else { // Fallback for contour without path
                stickerShapeDef = `<rect id="cut-shape" width="${bestLayout.itemW}" height="${bestLayout.itemH}" fill="none" stroke="${cutLineColor}" stroke-width="0.05mm" />`;
            }
            break;
        case CutShape.SQUARE:
        default:
            stickerShapeDef = `<rect id="cut-shape" width="${bestLayout.itemW}" height="${bestLayout.itemH}" fill="none" stroke="${cutLineColor}" stroke-width="0.05mm" />`;
    }
    
    const artworkGroup = `
        <g id="artwork">
            ${config.backgroundColor ? `<rect width="${bestLayout.itemW}" height="${bestLayout.itemH}" fill="${config.backgroundColor}" />` : ''}
            <image href="${image.src}" x="0" y="0" width="${bestLayout.itemW}" height="${bestLayout.itemH}" preserveAspectRatio="xMidYMid slice" />
        </g>
    `;
    const imageDef = type === 'print' ? artworkGroup : '';

    const stickerGroupDef = `
        <g id="sticker">
            ${imageDef}
        </g>
    `;
    
    const impositionGroups = Array.from({ length: bestLayout.rows }).map((_, r) => (
        Array.from({ length: bestLayout.cols }).map((_, c) => {
            const x = template.printableX + xOffset + c * (bestLayout.itemW + STICKER_SPACING);
            const y = template.printableY + yOffset + r * (bestLayout.itemH + STICKER_SPACING);
            return `<use href="#sticker" x="${x}" y="${y}" />`;
        }).join('')
    )).join('');
    
    const cutOnlyStickerGroup = `<g id="sticker"><use href="#cut-shape" /></g>`;

    return `
        <svg width="${template.width}mm" height="${svgHeight}mm" viewBox="0 0 ${template.width} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
                ${stickerShapeDef}
                ${type === 'print' ? stickerGroupDef : cutOnlyStickerGroup}
            </defs>
            ${config.mode ? generateRegMarksString(config.mode) : ''}
            ${impositionGroups}
        </svg>
    `;
  };

  const handleDownload = (type: 'print' | 'cut') => {
    const svgString = generateImpositionSvg(type);
    if (!svgString) {
        alert("No se puede generar el archivo. Verifica la configuración.");
        return;
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    let modeName = '';
    // User requested to keep SVG download option
    let fileExtension = 'svg'; 
    if(config.mode) {
        switch(config.mode) {
            case ProductionMode.XEROX: modeName = 'XEROX'; break;
            case ProductionMode.PLOTTER_EPSON: modeName = 'PLOTTER'; break;
            case ProductionMode.MIMAKI_DTF_UV: 
            case ProductionMode.MIMAKI_HOLO_UV: 
                modeName = config.mode.includes('DTF') ? 'MIMAKI-DTFUV' : 'MIMAKI-HOLOUV'; 
                // Although it's an SVG content, the user might want a PDF extension for their workflow.
                // fileExtension = 'pdf'; 
                break;
        }
    }

    a.href = url;
    a.download = `${config.quantity}pcs-${config.width}x${config.height}cm-${type.toUpperCase()}-${modeName}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (config.mode === ProductionMode.MIMAKI_DTF_UV || config.mode === ProductionMode.MIMAKI_HOLO_UV) {
        setShowMimakiInfoModal(true);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <CustomCursor position={cursorPosition} variant={cursorVariant} />
      <Header />
      <main className="max-w-screen-2xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- Left Panel: Configuration --- */}
          <div className="lg:col-span-4 space-y-8">
            <ConfigurationPanel 
                config={config} 
                onConfigChange={handleConfigChange}
                onVectorize={handleVectorize}
                isVectorizing={isVectorizing}
                onRemoveBackground={handleRemoveBackground}
                isRemovingBackground={isRemovingBackground}
                imageLoaded={!!image}
            />
            {isConfigReady && !image &&
                <FileUpload onFileChange={handleFileChange} />
            }
            {error && <div className="p-4 bg-orange-100 text-orange-700 rounded-lg">{error}</div>}
          </div>
          
          {/* --- Center Panel: Visuals --- */}
          <div className="lg:col-span-5 space-y-8">
            {!image ? (
                <div className="animate-fade-in">
                    <InspirationGallery videos={INSPIRATION_VIDEOS} />
                </div>
            ) : (
                <div className="animate-fade-in space-y-8">
                    <Preview 
                        image={image} 
                        config={config} 
                        onPreviewClick={() => setIsProductSheetModalOpen(true)}
                    />
                     {image && isAnyMimaki &&
                        <BackgroundRemovalTool
                            onRemove={handleRemoveBackground}
                            isRemoving={isRemovingBackground}
                        />
                    }
                    {isReadyForQuote && (
                        <ImpositionPreview
                            config={config}
                            image={image}
                            layout={layout}
                        />
                    )}
                </div>
            )}
          </div>

          {/* --- Right Panel: Summary --- */}
          <div className="lg:col-span-3">
            <div className="sticky top-28">
                <SummaryPanel 
                    config={config} 
                    image={image} 
                    layout={layout}
                    onDownload={handleDownload}
                    isReady={isReadyForQuote}
                    quoteMessage={quoteMessage}
                    onOpenEmailModal={() => setIsEmailModalOpen(true)}
                 />
            </div>
          </div>

        </div>
      </main>
      <DownloadInfoModal isOpen={showMimakiInfoModal} onClose={() => setShowMimakiInfoModal(false)} />
      <ProductSheetModal 
          isOpen={isProductSheetModalOpen}
          onClose={() => setIsProductSheetModalOpen(false)}
          config={config}
          image={image}
      />
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        quoteMessage={quoteMessage}
      />
    </div>
  );
}

export default App;
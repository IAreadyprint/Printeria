import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ConfigurationPanel from './components/ConfigurationPanel';
import Preview from './components/Preview';
import SummaryPanel from './components/SummaryPanel';
import InspirationGallery from './components/InspirationGallery';
import { generateCutPath, removeBackground } from './services/geminiService';
import { ImageInfo, DesignConfig, CutShape, ProductionMode, LaminationType, LayoutInfo } from './types';

const SHEET_TEMPLATES = {
    [ProductionMode.XEROX]: { width: 330, height: 480, printableWidth: 300, printableHeight: 420, printableX: 15, printableY: 45, markLength: 10, markStroke: 0.05 },
    [ProductionMode.PLOTTER_HD]: { width: 600, height: 1500, printableWidth: 500, printableHeight: 1400, printableX: 50, printableY: 50, markLength: 10, markStroke: 0.05 }
};
const STICKER_SPACING = 2; // mm

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
    const { width, height, quantity, mode } = config;
    if (!width || !height || !quantity) {
        return { stickersPerSheet: 0, totalSheets: 0, bestLayout: { cols: 0, rows: 0, rotated: false, itemW: 0, itemH: 0 } };
    }

    const itemW = width * 10;
    const itemH = height * 10;

    const template = SHEET_TEMPLATES[mode];
    const { printableWidth, printableHeight } = template;

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
  
  const [config, setConfig] = useState<DesignConfig>({
    quantity: 100,
    width: 8,
    height: 8,
    shape: CutShape.SQUARE,
    cornerRadius: 5,
    mode: ProductionMode.XEROX,
    lamination: LaminationType.NONE,
    cutPath: null,
    backgroundColor: null,
  });

  const layout = useMemo(() => calculateLayout(config), [config]);

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage({
          file,
          src: e.target?.result as string,
          width: img.width,
          height: img.height,
        });
        setConfig(prev => ({...prev, cutPath: null})); // Reset cut path on new image
        setError(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfigChange = useCallback((newConfig: Partial<DesignConfig>) => {
    setConfig(prev => {
      const updatedConfig = { ...prev, ...newConfig };
      if (newConfig.shape && newConfig.shape !== CutShape.CONTOUR) {
        updatedConfig.cutPath = null;
      }
      return updatedConfig;
    });
  }, []);

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
    
    if (mode === ProductionMode.PLOTTER_HD) {
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
    if (!image || !layout.stickersPerSheet) return '';
    
    const template = SHEET_TEMPLATES[config.mode];
    const { bestLayout } = layout;

    const totalBlockWidth = bestLayout.cols * bestLayout.itemW + (bestLayout.cols > 1 ? (bestLayout.cols - 1) * STICKER_SPACING : 0);
    const totalBlockHeight = bestLayout.rows * bestLayout.itemH + (bestLayout.rows > 1 ? (bestLayout.rows - 1) * STICKER_SPACING : 0);
    const xOffset = (template.printableWidth - totalBlockWidth) / 2;
    const yOffset = (template.printableHeight - totalBlockHeight) / 2;

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
            <use href="#cut-shape" />
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
        <svg width="${template.width}mm" height="${template.height}mm" viewBox="0 0 ${template.width} ${template.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
                ${stickerShapeDef}
                ${type === 'print' ? stickerGroupDef : cutOnlyStickerGroup}
            </defs>
            ${generateRegMarksString(config.mode)}
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
    const modeName = config.mode === ProductionMode.XEROX ? 'XEROX' : 'PLOTTER';
    a.href = url;
    a.download = `${config.quantity}pcs-${config.width}x${config.height}cm-${type.toUpperCase()}-${modeName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {image ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <Preview image={image} config={config} />
                    <ConfigurationPanel 
                        config={config} 
                        onConfigChange={handleConfigChange}
                        onVectorize={handleVectorize}
                        isVectorizing={isVectorizing}
                        onRemoveBackground={handleRemoveBackground}
                        isRemovingBackground={isRemovingBackground}
                        imageLoaded={!!image}
                    />
                </div>
            ) : (
                <FileUpload onFileChange={handleFileChange} />
            )}
             {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
             <InspirationGallery videos={INSPIRATION_VIDEOS} />
          </div>

          <div className="lg:col-span-1">
            <SummaryPanel 
                config={config} 
                image={image} 
                layout={layout}
                onDownload={handleDownload}
             />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
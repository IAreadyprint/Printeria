export interface ImageInfo {
    file: File;
    src: string;
    width: number;
    height: number;
}

export enum CutShape {
    CONTOUR = 'Contorno (IA)',
    SQUARE = 'Cuadrado',
    ROUNDED_SQUARE = 'Cuadrado Redondeado',
    CIRCLE = 'Círculo',
}

export enum ProductionMode {
    XEROX = 'Xerox (Prensa Digital)',
    PLOTTER_EPSON = 'Plotter EPSON (Impresión INKjet)',
    MIMAKI_DTF_UV = 'Mimaki 75 (DTF-UV)',
    MIMAKI_HOLO_UV = 'Mimaki 75 (HOLO-UV)',
}

export enum LaminationType {
    NONE = 'Sin Acabado',
    GLOSS = 'Laminado Brillante',
    MATTE = 'Laminado Mate',
}

export enum MimakiInputMode {
    QUANTITY = 'quantity',
    LENGTH = 'length',
}

export interface DesignConfig {
    quantity: number;
    width: number; // cm
    height: number; // cm
    shape: CutShape;
    cornerRadius: number; // mm
    mode: ProductionMode | null;
    lamination: LaminationType;
    cutPath: string | null;
    backgroundColor: string | null;
    cmykColor: string; // User input for CMYK, e.g., "C:10,M:20,Y:30,K:0"
    stickerSpacing: number; // mm, for Mimaki
    container: boolean; // for Mimaki
    mimakiInputMode: MimakiInputMode; // for Mimaki
    linearLengthCm: number; // for Mimaki length mode
}

export interface LayoutInfo {
    stickersPerSheet: number;
    totalSheets: number;
    bestLayout: {
        cols: number;
        rows: number;
        rotated: boolean;
        itemW: number;
        itemH: number;
    };
    // Mimaki specific
    linearMeters?: number;
    totalStickersProduced?: number;
}

export interface AuthUser {
    name: string;
    email: string;
    picture: string;
}
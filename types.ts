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
    PLOTTER_HD = 'Plotter HD (Gran Formato)',
}

export enum LaminationType {
    NONE = 'Sin Acabado',
    GLOSS = 'Laminado Brillante',
    MATTE = 'Laminado Mate',
}

export interface DesignConfig {
    quantity: number;
    width: number; // cm
    height: number; // cm
    shape: CutShape;
    cornerRadius: number; // mm
    mode: ProductionMode;
    lamination: LaminationType;
    cutPath: string | null;
    backgroundColor: string | null;
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
}

export interface AuthUser {
    name: string;
    email: string;
    picture: string;
}
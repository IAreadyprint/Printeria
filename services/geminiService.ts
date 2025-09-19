import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ImageInfo } from '../types';

// Converts a File object to a base64 encoded string for the API.
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                resolve(''); // Should not happen with readAsDataURL
            }
        };
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

export const generateCutPath = async (image: ImageInfo): Promise<string | null> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set");
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = await fileToGenerativePart(image.file);
        const textPart = {
            text: `Analiza la imagen y genera una única ruta SVG (path data) que delinee el contorno del sujeto principal de forma suave y precisa. La ruta debe ser optimizada, cerrada y normalizada a un viewBox de "0 0 100 100". Proporciona únicamente el valor del atributo 'd' de la ruta SVG, sin etiquetas, comillas ni explicaciones.`
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        cutPath: {
                            type: Type.STRING,
                            description: "La ruta SVG (path data) que delinea el contorno del objeto."
                        }
                    },
                    required: ["cutPath"]
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result && result.cutPath) {
            return result.cutPath;
        }
        return null;
    } catch (error) {
        console.error("Error generating cut path with Gemini API:", error);
        return null;
    }
};

export const removeBackground = async (image: ImageInfo): Promise<{ data: string; mimeType: string; } | null> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set");
        throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = await fileToGenerativePart(image.file);
        const textPart = {
            text: "Remove the background of this image completely. The output should be only the main subject with a transparent background. Do not add any extra elements, text, or padding."
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return {
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType
                };
            }
        }
        return null;

    } catch (error) {
        console.error("Error removing background with Gemini API:", error);
        return null;
    }
};
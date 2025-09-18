
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
    onFileChange: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((file: File | null | undefined) => {
        if (file && file.type.startsWith('image/')) {
            onFileChange(file);
        } else {
            alert('Por favor, selecciona un archivo de imagen válido (JPG, PNG, WEBP, etc.).');
        }
    }, [onFileChange]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };
    const handleClick = () => {
        document.getElementById('file-input')?.click();
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        handleFile(file);
    };

    return (
        <div 
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 hover:border-cyan-400'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <UploadIcon className="w-16 h-16 text-slate-400 mb-4" />
            <p className="text-xl font-semibold text-slate-700">Arrastra y suelta tu archivo aquí</p>
            <p className="text-slate-500">o haz clic para seleccionarlo</p>
            <p className="text-xs text-slate-400 mt-4">Recomendado: 150ppp a tamaño real</p>
            <input 
                id="file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
            />
        </div>
    );
};

export default FileUpload;

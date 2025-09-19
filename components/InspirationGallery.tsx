import React from 'react';

interface InspirationGalleryProps {
    videos: string[];
}

const InspirationGallery: React.FC<InspirationGalleryProps> = ({ videos }) => {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Galería de Inspiración</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 [perspective:1000px]">
                {videos.map((videoUrl, index) => (
                    <div key={index} className="aspect-w-9 aspect-h-16 bg-slate-200 rounded-lg overflow-hidden shadow-md transition-all duration-300 transform-gpu hover:scale-[1.03] hover:-rotate-y-3 hover:rotate-x-2 hover:shadow-2xl">
                        <video
                            className="w-full h-full object-cover"
                            src={videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                        >
                            Tu navegador no soporta el tag de video.
                        </video>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InspirationGallery;
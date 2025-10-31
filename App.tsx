import React, { useState, useRef, useCallback } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { fileToGenerativePart } from './utils/fileUtils';
import { UploadIcon, MagicWandIcon, DownloadIcon } from './components/icons';

const Header: React.FC = () => (
  <header className="py-4 px-6">
    <h1 className="text-3xl md:text-5xl font-bold glitch" data-text="H4X IMAGE EDITOR">H4X IMAGE EDITOR</h1>
    <p className="text-cyan-400 mt-1">Modify reality. One pixel at a time.</p>
  </header>
);

const ImageUploader: React.FC<{
  onFileSelect: (file: File) => void;
  originalImageDataUrl: string | null;
}> = ({ onFileSelect, originalImageDataUrl }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div 
      className="border-2 border-dashed border-cyan-600 rounded-lg p-4 text-center cursor-pointer
                 hover:border-cyan-400 hover:bg-gray-800/20 transition-all duration-300
                 flex flex-col items-center justify-center aspect-square"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {originalImageDataUrl ? (
        <img src={originalImageDataUrl} alt="Original preview" className="max-w-full max-h-full object-contain rounded-md" />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <UploadIcon className="w-12 h-12 mb-4 text-cyan-500" />
          <p className="font-bold text-lg">UPLOAD IMAGE</p>
          <p className="text-sm">Drag & drop or click to select</p>
        </div>
      )}
    </div>
  );
};

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
    <p className="text-cyan-400 animate-pulse">HACKING THE PIXELS...</p>
  </div>
);

const App: React.FC = () => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageDataUrl, setOriginalImageDataUrl] = useState<string | null>(null);
  const [editedImageData, setEditedImageData] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setOriginalImageFile(file);
    setEditedImageData(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!originalImageFile || !prompt) {
      setError("Please upload an image and provide a modification prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImageData(null);

    try {
      const imagePart = await fileToGenerativePart(originalImageFile);
      const resultBase64 = await editImageWithGemini(imagePart.data, imagePart.mimeType, prompt);
      setEditedImageData(`data:${imagePart.mimeType};base64,${resultBase64}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unknown error occurred while communicating with the AI.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!editedImageData) return;
    const link = document.createElement('a');
    link.href = editedImageData;
    link.download = `h4x_edit_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-black min-h-screen text-gray-200 font-mono custom-scrollbar overflow-y-auto"
         style={{
           backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)',
           backgroundSize: '20px 20px'
         }}>
      <div className="container mx-auto px-4 py-8">
        <Header />
        <main className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls Column */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-800 rounded-lg p-6 flex flex-col gap-6 shadow-2xl shadow-cyan-900/20">
            <div>
              <label className="text-lg font-bold text-cyan-400 block mb-2">1: SOURCE IMAGE</label>
              <ImageUploader onFileSelect={handleFileSelect} originalImageDataUrl={originalImageDataUrl} />
            </div>
            <div>
              <label htmlFor="prompt" className="text-lg font-bold text-cyan-400 block mb-2">2: MODIFICATION_PROMPT</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., make it a cyberpunk city at night with neon lights"
                rows={4}
                className="w-full bg-gray-800/80 border-2 border-gray-600 rounded-md p-3 text-gray-200
                           focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !originalImageFile || !prompt}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-black font-bold py-3 px-4 rounded-md 
                         hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300
                         disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <MagicWandIcon className="w-6 h-6" />
              <span>Generate</span>
            </button>
          </div>
          
          {/* Output Column */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-800 rounded-lg p-6 flex flex-col items-center justify-center shadow-2xl shadow-cyan-900/20 aspect-square">
            {isLoading && <Loader />}
            {error && <div className="text-center text-red-400 border border-red-500 bg-red-900/30 p-4 rounded-md"><p className="font-bold text-lg">ERROR</p><p>{error}</p></div>}
            {!isLoading && !error && editedImageData && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <img src={editedImageData} alt="Edited result" className="max-w-full max-h-[80%] object-contain rounded-md" />
                 <button
                  onClick={handleDownload}
                  className="mt-4 flex items-center justify-center gap-2 bg-green-600 text-black font-bold py-2 px-6 rounded-md 
                         hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span>Download</span>
                </button>
              </div>
            )}
            {!isLoading && !error && !editedImageData && (
              <div className="text-center text-gray-500">
                <p className="text-xl font-bold">OUTPUT</p>
                <p>AI-generated image will appear here.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
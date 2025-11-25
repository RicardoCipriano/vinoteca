import { useState, useRef } from "react";
import { Camera, X, RotateCcw, Check, Upload, Wine } from "lucide-react";
import { Button } from "./ui/button";

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Input dedicado para câmera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* Input dedicado para galeria (sem capture) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent z-10">
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-white">Capturar rótulo do vinho</h2>
        <div className="w-10" />
      </div>

      {/* Camera View / Preview */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4A0D12] to-[#6B0F12]">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-center">
            <Camera className="w-24 h-24 text-[#CDA15D] mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#F7EFE6] mb-8">Posicione o rótulo no enquadramento</p>
            <div className="border-4 border-[#CDA15D] w-64 h-96 mx-auto rounded-lg border-dashed" />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
        {capturedImage ? (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="bg-white/90 hover:bg-white border-none text-black h-14 px-8"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Refazer
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#6B0F12] hover:bg-[#4A0D12] text-white h-14 px-8"
            >
              <Check className="w-5 h-5 mr-2" />
              Usar foto
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-16 h-16 rounded-full bg-white border-4 border-[#CDA15D] flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Capturar imagem"
            >
              <Wine className="w-10 h-10 text-[#CDA15D]" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="text-white flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Enviar da galeria
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

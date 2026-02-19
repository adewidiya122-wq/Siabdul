import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface FaceScannerProps {
  onCapture: (imageBase64: string) => void;
  isProcessing: boolean;
}

const FaceScanner: React.FC<FaceScannerProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageBase64);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden shadow-xl border-4 border-indigo-100">
        {error ? (
          <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">
            {error}
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
            />
            {/* Face guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-full border-dashed"></div>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="font-semibold tracking-wide animate-pulse">Analyzing Face...</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        {!error && (
          <button
            onClick={handleCapture}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
            }`}
          >
            <Camera className="w-5 h-5" />
            {isProcessing ? 'Verifying...' : 'Verify Attendance'}
          </button>
        )}
        
        {error && (
          <button 
            onClick={startCamera}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry Camera
          </button>
        )}
      </div>
    </div>
  );
};

export default FaceScanner;
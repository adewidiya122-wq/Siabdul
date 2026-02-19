import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, Settings } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const [devices, setDevices] = useState<Array<{ id: string; label: string }>>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef<boolean>(false);

  // 1. Fetch available video devices on mount
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!isMounted) return;
        
        if (cameras && cameras.length > 0) {
          setDevices(cameras);
          // Default to the last camera (usually back camera on mobile)
          setActiveDeviceId(cameras[cameras.length - 1].id);
        } else {
          setScanError("Tidak ada kamera ditemukan.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error getting cameras", err);
        setScanError("Izin ditolak atau kamera tidak ditemukan.");
        if (onError) onError(String(err));
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle Scanner Start/Stop/Switch
  useEffect(() => {
    if (!activeDeviceId) return;

    const startScanning = async () => {
      // If a scanner instance exists, stop it first (switching cameras)
      if (scannerRef.current) {
        try {
            if (isScanning.current) {
                await scannerRef.current.stop();
                isScanning.current = false;
            }
            scannerRef.current.clear();
        } catch (e) {
            console.warn("Failed to stop previous scan instance", e);
        }
      }

      // Initialize new instance
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          activeDeviceId,
          {
            fps: 10,
            qrbox: undefined, // Let it scan full frame, we add custom overlay
            aspectRatio: 1.0, // Prefer 1:1 aspect ratio for the video stream if possible
            disableFlip: false 
          },
          (decodedText) => {
            // Success Callback
            const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
            audio.play().catch(() => {});
            onScan(decodedText);
          },
          (errorMessage) => {
            // Error Callback (Scanning... waiting for code)
          }
        );
        isScanning.current = true;
        setScanError(null);
      } catch (err) {
        console.error("Failed to start scanner", err);
        setScanError("Gagal memulai video stream.");
        isScanning.current = false;
      }
    };

    startScanning();

    return () => {
      // Cleanup on unmount or device change
      if (scannerRef.current && isScanning.current) {
        scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            isScanning.current = false;
        }).catch(err => console.error("Failed to stop scanner on cleanup", err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeviceId]);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveDeviceId(e.target.value);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
        {/* Scanner Area */}
        <div className="overflow-hidden rounded-xl shadow-lg bg-gray-900 relative w-full aspect-square">
            {/* The library injects the video element here */}
            <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
            
            {/* Custom Overlay - Purple Box Guide */}
            {!scanError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="relative w-48 h-48 sm:w-64 sm:h-64 border-2 border-indigo-500 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0)]">
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-600 -mt-1 -ml-1 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-600 -mt-1 -mr-1 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-600 -mb-1 -ml-1 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-600 -mb-1 -mr-1 rounded-br-lg"></div>
                        
                        {/* Scanning Animation Line */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl opacity-50">
                             <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent absolute top-0 animate-scan-down"></div>
                        </div>
                    </div>
                    <p className="absolute bottom-4 sm:bottom-8 text-white/80 text-xs font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                        Arahkan QR Code ke dalam kotak
                    </p>
                </div>
            )}

            {scanError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-6 text-center z-20">
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-8 h-8 text-red-500 mb-2" />
                        <p className="font-medium text-red-400">Scanner Error</p>
                        <p className="text-sm text-gray-400">{scanError}</p>
                    </div>
                </div>
            )}
            
            {!scanError && (
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white font-medium flex items-center gap-1 z-20">
                    <Camera className="w-3 h-3" />
                    Aktif
                </div>
            )}
        </div>

        {/* Device Selection Dropdown */}
        {devices.length > 0 && (
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                    <label htmlFor="camera-select" className="block text-xs font-medium text-gray-500 mb-1">
                        Pilih Kamera
                    </label>
                    <div className="relative">
                        <select
                            id="camera-select"
                            value={activeDeviceId || ''}
                            onChange={handleDeviceChange}
                            className="block w-full pl-2 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md bg-gray-50 text-gray-800"
                        >
                            {devices.map((device) => (
                                <option key={device.id} value={device.id}>
                                    {device.label || `Kamera ${device.id.slice(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        )}
        
        <style>{`
          @keyframes scan-down {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan-down {
            animation: scan-down 2s linear infinite;
          }
        `}</style>
    </div>
  );
};

export default QRScanner;
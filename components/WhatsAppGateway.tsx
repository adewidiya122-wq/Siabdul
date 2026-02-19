import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Smartphone, RefreshCw, Power, CheckCircle, XCircle, MessageSquare, Trash2, AlertTriangle, Wifi } from 'lucide-react';
import { WALog } from '../types';

const WhatsAppGateway: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [logs, setLogs] = useState<WALog[]>([]);
  const [loading, setLoading] = useState(false);

  // Load connection state and logs from local storage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('wa_gateway_connected');
    if (savedState === 'true') {
      setIsConnected(true);
    } else {
      generateNewQR();
    }

    const savedLogs = localStorage.getItem('wa_gateway_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Poll for new logs from local storage (simulating real-time updates from App.tsx)
  useEffect(() => {
    const interval = setInterval(() => {
        const savedLogs = localStorage.getItem('wa_gateway_logs');
        if (savedLogs) {
             setLogs(JSON.parse(savedLogs));
        }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const generateNewQR = () => {
    // Simulate a unique session ID for the QR
    setQrValue(`SIABDUL-WA-SESSION-${Date.now()}`);
  };

  const handleConnect = () => {
    setLoading(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      localStorage.setItem('wa_gateway_connected', 'true');
      setLoading(false);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    localStorage.setItem('wa_gateway_connected', 'false');
    generateNewQR();
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('wa_gateway_logs');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Smartphone className="w-8 h-8 text-green-600" /> WhatsApp Gateway
          </h2>
          <p className="text-gray-500 text-sm">Hubungkan perangkat untuk mengirim notifikasi otomatis tanpa API Key.</p>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isConnected ? 'Terhubung' : 'Terputus'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Connection Status & QR */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                {!isConnected ? (
                    <>
                        <h3 className="font-bold text-gray-800 mb-4">Scan QR Code</h3>
                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-4 relative">
                            {loading ? (
                                <div className="w-48 h-48 flex items-center justify-center">
                                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="cursor-pointer group relative" onClick={handleConnect} title="Klik untuk simulasi connect">
                                    <QRCode value={qrValue} size={192} />
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-sm font-bold text-indigo-600">Klik untuk Simulasi Scan</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            1. Buka WhatsApp di HP Anda<br/>
                            2. Menu &gt; Perangkat Tertaut<br/>
                            3. Tautkan Perangkat
                        </p>
                        <div className="w-full bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-left text-yellow-700 flex gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p>Ini adalah simulasi Gateway lokal. Dalam produksi nyata, Anda memerlukan server Node.js (seperti Baileys).</p>
                        </div>
                    </>
                ) : (
                    <div className="py-8 w-full">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scaleIn">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">WhatsApp Terhubung</h3>
                        <p className="text-gray-500 text-sm mb-6">Siap mengirim notifikasi absensi.</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={handleDisconnect}
                                className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Power className="w-4 h-4" /> Putuskan Koneksi
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Message Logs */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" /> Log Pengiriman
                    </h3>
                    <button 
                        onClick={clearLogs}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" /> Bersihkan
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">Belum ada pesan terkirim</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 animate-fadeIn">
                                <div className={`p-2 rounded-full h-fit ${log.status === 'sent' ? 'bg-green-50' : 'bg-red-50'}`}>
                                    {log.status === 'sent' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-gray-800 text-sm">{log.target}</p>
                                        <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-lg font-mono">{log.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppGateway;
import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Pencil, Download, Trash2, School, CheckCircle, XCircle, FileText, Stethoscope } from 'lucide-react';
import { Student } from '../types';

interface StudentCardProps {
  student: Student;
  schoolName: string;
  schoolLogo: string | null;
  attendanceStatus?: 'present' | 'late' | 'sick' | 'permission' | 'alpha' | null;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onMarkAttendance?: (student: Student, status: 'present' | 'sick' | 'permission' | 'alpha') => void;
  hideDownloadButton?: boolean;
  showQrCode?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ 
  student, 
  schoolName, 
  schoolLogo,
  attendanceStatus,
  onEdit, 
  onDelete,
  onMarkAttendance,
  hideDownloadButton = false,
  showQrCode = true
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadIDCard = async () => {
    setIsDownloading(true);
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        setIsDownloading(false);
        return;
    }

    // Set dimensions for the ID Card (e.g., 400x600 px)
    const width = 400;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw Header Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, '#4f46e5'); // Indigo 600
    gradient.addColorStop(1, '#6366f1'); // Indigo 500
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 160);

    // 2. Draw School Logo (If exists)
    if (schoolLogo) {
        try {
            const logoImg = new Image();
            logoImg.crossOrigin = "anonymous";
            logoImg.src = schoolLogo;
            await new Promise((resolve) => { 
                logoImg.onload = resolve; 
                logoImg.onerror = resolve; // Continue even if fails
            });
            
            // Draw logo small in top left or center top
            const logoSize = 50;
            // Draw centered slightly above text
            const logoX = (width - logoSize) / 2;
            const logoY = 20;
            
            // Circular clip for logo
            ctx.save();
            ctx.beginPath();
            ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            ctx.restore();
        } catch (e) {
            console.error("Failed to draw logo", e);
        }
    }

    // 3. Draw Title & School Name
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Adjust position based on logo presence
    const textStartY = schoolLogo ? 90 : 60;
    
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('KARTU PELAJAR', width / 2, textStartY);
    
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(schoolName, width / 2, textStartY + 30);

    // 4. Draw Avatar (Circle)
    const avatarSize = 120;
    const avatarX = (width - avatarSize) / 2;
    const avatarY = 130; // Pushed down slightly

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = student.avatar;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
    } catch (e) {
        // Fallback if image fails (e.g. CORS)
        ctx.fillStyle = '#e0e7ff';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = '#4f46e5';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(student.name.charAt(0).toUpperCase(), width / 2, avatarY + avatarSize / 2);
    }
    ctx.restore();

    // Draw border around avatar
    ctx.beginPath();
    ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 5. Draw Student Info
    ctx.fillStyle = '#1f2937'; // Gray 800
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(student.name, width / 2, 300);

    ctx.fillStyle = '#6b7280'; // Gray 500
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText(`NISN: ${student.nisn}`, width / 2, 330);
    
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`${student.grade}`, width / 2, 350);

    // 6. Draw QR Code
    // We grab the SVG from the React component rendered in DOM
    const svgElement = qrRef.current?.querySelector('svg');
    if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        try {
            const qrImg = new Image();
            qrImg.src = url;
            await new Promise((resolve) => { qrImg.onload = resolve; });
            
            // Draw a white background for QR
            const qrSize = 160;
            const qrY = 370;
            ctx.fillStyle = '#ffffff'; // White bg for QR container
            // Shadow effect simulation
            ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
            ctx.shadowBlur = 10;
            ctx.fillRect((width - qrSize) / 2 - 10, qrY - 10, qrSize + 20, qrSize + 20);
            ctx.shadowColor = "transparent";
            
            ctx.drawImage(qrImg, (width - qrSize) / 2, qrY, qrSize, qrSize);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to draw QR code", e);
        }
    }

    // 7. Footer
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, height - 20, width, 20);

    // 8. Download
    const link = document.createElement('a');
    link.download = `ID_${student.name.replace(/\s+/g, '_')}_${student.nisn}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    setIsDownloading(false);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow duration-300 relative group ${showQrCode ? 'p-6 space-y-4' : 'p-4 space-y-3'}`}>
      
      {onDelete && (
        <button 
          onClick={() => onDelete(student)}
          className="absolute top-3 left-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Hapus Siswa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {onEdit && (
        <button 
          onClick={() => onEdit(student)}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Edit Siswa"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      <div className="relative">
        <img 
          src={student.avatar} 
          alt={student.name} 
          className={`${showQrCode ? 'w-20 h-20' : 'w-16 h-16'} rounded-full object-cover border-4 border-indigo-50 transition-all`}
          crossOrigin="anonymous" 
        />
        {attendanceStatus && (
           <div className={`absolute bottom-0 right-0 w-6 h-6 border-2 border-white rounded-full flex items-center justify-center ${
               attendanceStatus === 'present' || attendanceStatus === 'late' ? 'bg-green-500' :
               attendanceStatus === 'sick' ? 'bg-yellow-500' :
               attendanceStatus === 'permission' ? 'bg-blue-500' : 'bg-red-500'
           }`}>
               {attendanceStatus === 'present' || attendanceStatus === 'late' ? <CheckCircle className="w-4 h-4 text-white" /> :
                attendanceStatus === 'sick' ? <Stethoscope className="w-3 h-3 text-white" /> :
                attendanceStatus === 'permission' ? <FileText className="w-3 h-3 text-white" /> :
                <XCircle className="w-4 h-4 text-white" />
               }
           </div>
        )}
      </div>
      
      <div className="text-center w-full">
        <h3 className={`font-bold text-gray-800 truncate ${showQrCode ? 'text-lg' : 'text-base'}`}>{student.name}</h3>
        <p className={`text-indigo-600 font-mono font-medium ${showQrCode ? 'text-sm' : 'text-xs'}`}>{student.nisn}</p>
        <p className="text-xs text-gray-400">{student.grade}</p>
        
        {showQrCode && (
          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-center gap-1.5 text-xs text-gray-400">
               {schoolLogo ? (
                   <img src={schoolLogo} alt="Logo" className="w-4 h-4 object-contain" />
               ) : (
                   <School className="w-3 h-3" />
               )}
               <span className="truncate max-w-[150px]">{schoolName}</span>
          </div>
        )}
      </div>

      <div className={`bg-white p-2 rounded-lg border border-gray-200 shadow-inner ${showQrCode ? '' : 'hidden'}`} ref={qrRef}>
        <QRCode 
          value={student.nisn} 
          size={120} 
          viewBox={`0 0 256 256`}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        />
      </div>

      {onMarkAttendance && (
        <div className="w-full grid grid-cols-4 gap-2 pt-2 border-t border-gray-50">
            <button 
                onClick={() => onMarkAttendance(student, 'present')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${attendanceStatus === 'present' ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                title="Hadir"
            >
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Hadir</span>
            </button>
            <button 
                onClick={() => onMarkAttendance(student, 'sick')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${attendanceStatus === 'sick' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500' : 'bg-gray-50 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'}`}
                title="Sakit"
            >
                <Stethoscope className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Sakit</span>
            </button>
            <button 
                onClick={() => onMarkAttendance(student, 'permission')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${attendanceStatus === 'permission' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
                title="Izin"
            >
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Izin</span>
            </button>
            <button 
                onClick={() => onMarkAttendance(student, 'alpha')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${attendanceStatus === 'alpha' ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                title="Alpa"
            >
                <XCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Alpa</span>
            </button>
        </div>
      )}
      
      {!hideDownloadButton && (
      <div className="w-full pt-2">
        <button 
          onClick={downloadIDCard}
          disabled={isDownloading}
          className={`w-full py-2 px-4 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 ${showQrCode ? '' : 'text-xs py-1.5'}`}
        >
          {isDownloading ? (
             <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          ) : (
             <Download className="w-4 h-4" />
          )}
          Unduh Kartu
        </button>
      </div>
      )}
    </div>
  );
};

export default StudentCard;
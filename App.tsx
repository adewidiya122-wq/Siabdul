import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ScanFace, 
  QrCode,
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle,
  Menu,
  X,
  Plus,
  ArrowRight,
  Folder,
  ChevronLeft,
  ChevronDown,
  School,
  BarChart3,
  Download,
  Calendar,
  Grid,
  Table as TableIcon,
  Clock,
  MessageCircle,
  LogOut,
  Settings,
  Pencil,
  Trash2,
  AlertTriangle,
  Info,
  FileSpreadsheet,
  Upload,
  Keyboard,
  CreditCard,
  Image as ImageIcon,
  Save,
  FileType,
  Eye,
  Stethoscope,
  FileQuestion,
  ClipboardList,
  Share2,
  Link,
  Server,
  Globe,
  Send,
  Smartphone,
  RefreshCw,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { MOCK_STUDENTS } from './constants';
import { Student, AttendanceRecord, ViewState, WhatsAppConfig, WALog } from './types';
import StudentCard from './components/StudentCard';
import QRScanner from './components/QRScanner';
import StudentForm from './components/StudentForm';
import LoginPage from './components/LoginPage';
import WhatsAppGateway from './components/WhatsAppGateway';
import { generateAttendanceReport } from './services/geminiService';

// --- Components for Modals ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [view, setView] = useState<ViewState>('dashboard');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  
  // School Settings State
  const [schoolName, setSchoolName] = useState("MTs Riyadlul Ulum");
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  
  // WhatsApp Settings State
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>({
    mode: 'link', // 'link' (wa.me) or 'gateway' (API)
    apiUrl: 'https://api.fonnte.com/send', // Default example (Fonnte)
    apiKey: '',
    autoSend: false // Default off
  });
  const [isSendingWA, setIsSendingWA] = useState(false);
  
  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Class Management State
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isManagingClasses, setIsManagingClasses] = useState(false);

  // Modal States
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  
  const [currentClassAction, setCurrentClassAction] = useState<string>('');
  const [inputClassName, setInputClassName] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // New state to handle delete restrictions
  const [deleteRestriction, setDeleteRestriction] = useState<string | null>(null);

  // Class View State (Grid or Matrix)
  const [classViewMode, setClassViewMode] = useState<'grid' | 'matrix'>('grid');
  const [matrixMonth, setMatrixMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Export State
  const [exportDate, setExportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exportMonth, setExportMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  
  // New state for Report Page Preview
  const [reportViewType, setReportViewType] = useState<'daily' | 'monthly'>('daily');

  const [lastScanned, setLastScanned] = useState<Student | null>(null);
  
  // Processing states
  const [reportLoading, setReportLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [reportText, setReportText] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [manualInput, setManualInput] = useState('');

  // Student Editing State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Extract unique classes from MOCK_STUDENTS on init
    const uniqueClasses = Array.from(new Set(MOCK_STUDENTS.map(s => s.grade))).sort();
    setClasses(uniqueClasses);
  }, []);

  // Login Handler
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setView('dashboard');
    setIsManagingClasses(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // --- WhatsApp Sending Logic ---
  const sendWhatsAppNotification = async (student: Student, time: Date, isAuto: boolean = false) => {
    if (!student.parentPhone) return;

    let phone = student.parentPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    
    const timeStr = time.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
    const message = `Assalamualaikum Bapak/Ibu Wali Murid.\n\nDiinformasikan bahwa siswa:\nNama: *${student.name}*\nKelas: ${student.grade}\n\nTelah *HADIR* di sekolah pada pukul ${timeStr} WIB.\n\nTerima kasih.\n_Sistem Absensi SIABDUL_`;

    if (waConfig.mode === 'link') {
        const encodedMessage = encodeURIComponent(message);
        // Use direct system link (whatsapp://) to open installed app without browser tabs
        window.location.href = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
    } else {
        // --- GATEWAY MODE LOGIC ---
        setIsSendingWA(true);
        
        // Check if using the internal "Simulated Gateway" page
        const isLocalGateway = localStorage.getItem('wa_gateway_connected') === 'true';

        if (isLocalGateway && waConfig.apiUrl === 'https://api.fonnte.com/send') {
            // Use Internal Simulation
            setTimeout(() => {
                const newLog: WALog = {
                    id: crypto.randomUUID(),
                    target: phone,
                    message: message,
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                };
                
                const currentLogs = JSON.parse(localStorage.getItem('wa_gateway_logs') || '[]');
                const updatedLogs = [newLog, ...currentLogs];
                localStorage.setItem('wa_gateway_logs', JSON.stringify(updatedLogs));
                
                if (!isAuto) alert(`Pesan berhasil dikirim via Gateway Lokal ke ${student.name}!`);
                setIsSendingWA(false);
            }, 500); // Faster simulation for auto
            return;
        }

        // External API Gateway (Fonnte/Twilio etc)
        if (!waConfig.apiUrl) {
            if (!isAuto) alert('URL API Gateway belum dikonfigurasi!');
            setIsSendingWA(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('target', phone);
            formData.append('message', message);
            if (waConfig.apiKey) {
                 formData.append('Authorization', waConfig.apiKey);
            }

            const response = await fetch(waConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': waConfig.apiKey
                },
                body: formData
            });
            
            if (response.ok) {
                if (!isAuto) alert(`Pesan terkirim ke ${student.name}!`);
            } else {
                console.error("WA Gateway Error");
                if (!isAuto) alert('Gagal mengirim pesan via Gateway External.');
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            if (!isAuto) alert('Terjadi kesalahan koneksi ke Gateway.');
        } finally {
            setIsSendingWA(false);
        }
    }
  };

  const handleQRScan = (decodedText: string) => {
      if (lastScanned && lastScanned.nisn === decodedText) {
          return;
      }

      // Find student by NISN (primary) or ID (legacy/fallback)
      const student = students.find(s => s.nisn === decodedText || s.id === decodedText);

      if (student) {
        const now = new Date();
        const alreadyPresent = attendance.some(
          a => a.studentId === student.id && 
          a.timestamp.toDateString() === now.toDateString()
        );

        if (alreadyPresent) {
          setScanMessage({ type: 'success', text: `${student.name} sudah tercatat hadir.` });
          setLastScanned(student);
        } else {
          const newRecord: AttendanceRecord = {
            id: crypto.randomUUID(),
            studentId: student.id,
            timestamp: now,
            status: 'present'
          };
          setAttendance(prev => [newRecord, ...prev]);
          setLastScanned(student);
          setScanMessage({ type: 'success', text: `Verifikasi Berhasil` });

          // Auto Send Logic Trigger
          if (waConfig.mode === 'gateway' && waConfig.autoSend && student.parentPhone) {
              // Trigger send without blocking UI
              sendWhatsAppNotification(student, now, true);
          }
        }
      } else {
         setScanMessage({ type: 'error', text: `NISN Tidak Dikenal: ${decodedText}` });
      }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
        handleQRScan(manualInput.trim());
        setManualInput('');
        // Keep focus for continuous scanning with external device
        if (manualInputRef.current) {
            manualInputRef.current.focus();
        }
    }
  };

  const handleNextStudent = () => {
    setLastScanned(null);
    setScanMessage(null);
    setManualInput('');
    // Focus back on input when resetting
    setTimeout(() => {
        if (manualInputRef.current) manualInputRef.current.focus();
    }, 100);
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportText("");
    const report = await generateAttendanceReport(attendance, students);
    setReportText(report);
    setReportLoading(false);
  };

  const handleSaveStudent = (studentData: Student) => {
    setStudents(prev => {
      const exists = prev.some(s => s.id === studentData.id);
      if (exists) {
        return prev.map(s => s.id === studentData.id ? studentData : s);
      }
      return [...prev, studentData];
    });
    
    if (!classes.includes(studentData.grade)) {
        setClasses(prev => [...prev, studentData.grade].sort());
    }

    setView('students');
    setEditingStudent(null);
    if (!selectedClass) {
        setSelectedClass(studentData.grade);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setView('student-form');
  };

  const handleAddNewStudent = () => {
    setEditingStudent(null);
    setView('student-form');
  };

  // --- Manual Attendance Marking (S/I/A) ---
  const handleMarkAttendance = (student: Student, status: 'present' | 'sick' | 'permission' | 'alpha') => {
      const now = new Date();
      
      // Remove existing record for today if any (though in Manual View we expect none, this is safe)
      const filteredAttendance = attendance.filter(a => 
          !(a.studentId === student.id && a.timestamp.toDateString() === now.toDateString())
      );
      
      const newRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          studentId: student.id,
          timestamp: now,
          status: status
      };

      setAttendance([newRecord, ...filteredAttendance]);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSchoolLogo(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Excel Import Handlers ---
  
  const handleDownloadTemplate = () => {
    const header = ["Name", "NISN", "ParentPhone"];
    const rows = [["John Doe", "0012345678", "628123456789"]];
    
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Format_Import_Siswa.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedClass) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            const newStudents: Student[] = [];
            
            data.forEach((row: any) => {
                // Require Name and NISN
                if (row.Name && row.NISN) {
                    const name = String(row.Name).trim();
                    const nisn = String(row.NISN).replace(/\D/g, ''); // Ensure pure numbers
                    const phone = row.ParentPhone ? String(row.ParentPhone).replace(/\D/g, '') : undefined;
                    
                    // Check if NISN already exists in current data to prevent duplicates
                    if (students.some(s => s.nisn === nisn)) {
                        console.warn(`Skipping duplicate NISN: ${nisn}`);
                        return;
                    }

                    // Generate a random ID for internal use
                    const id = `STU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                    
                    // Generate avatar using UI Avatars service based on name
                    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200`;

                    newStudents.push({
                        id,
                        nisn,
                        name,
                        grade: selectedClass,
                        avatar,
                        parentPhone: phone
                    });
                }
            });

            if (newStudents.length > 0) {
                setStudents(prev => [...prev, ...newStudents]);
                alert(`Berhasil mengimpor ${newStudents.length} siswa ke kelas ${selectedClass}.`);
            } else {
                alert("Tidak ada data siswa valid ditemukan. Pastikan kolom 'Name' dan 'NISN' ada.");
            }
        } catch (error) {
            console.error("Error importing file", error);
            alert("Gagal memproses file Excel.");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    reader.readAsBinaryString(file);
  };

  // --- Modal Handlers ---

  const openAddClassModal = () => {
    setInputClassName('');
    setShowAddClassModal(true);
  };

  const confirmAddClass = () => {
    if (inputClassName && inputClassName.trim() !== "") {
        if (classes.includes(inputClassName)) {
            alert("Kelas sudah ada!");
            return;
        }
        setClasses(prev => [...prev, inputClassName].sort());
        setShowAddClassModal(false);
    }
  };

  const openRenameModal = (cls: string) => {
    setCurrentClassAction(cls);
    setInputClassName(cls);
    setShowRenameModal(true);
  };

  const confirmRenameClass = () => {
    const oldName = currentClassAction;
    const newName = inputClassName;

    if (newName && newName.trim() !== "" && newName !== oldName) {
      if (classes.includes(newName)) {
        alert("Nama kelas sudah digunakan.");
        return;
      }
      
      setClasses(prev => prev.map(c => c === oldName ? newName : c).sort());
      setStudents(prev => prev.map(s => s.grade === oldName ? { ...s, grade: newName } : s));
      setShowRenameModal(false);
    }
  };

  const openDeleteModal = (cls: string) => {
    const studentsInClass = students.filter(s => s.grade === cls);
    setCurrentClassAction(cls);
    
    if (studentsInClass.length > 0) {
      setDeleteRestriction(`Tidak dapat menghapus kelas "${cls}" karena masih berisi ${studentsInClass.length} siswa. Hapus atau pindahkan siswa terlebih dahulu.`);
    } else {
      setDeleteRestriction(null);
    }
    
    setShowDeleteModal(true);
  };

  const confirmDeleteClass = () => {
    if (deleteRestriction) {
        setShowDeleteModal(false);
        return;
    }
    setClasses(prev => prev.filter(c => c !== currentClassAction));
    setShowDeleteModal(false);
  };

  const openDeleteStudentModal = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteStudentModal(true);
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      // Remove student
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      // Remove associated attendance records to keep data clean
      setAttendance(prev => prev.filter(a => a.studentId !== studentToDelete.id));
      
      setStudentToDelete(null);
      setShowDeleteStudentModal(false);
    }
  };

  // --- Export Logic (Unified) ---

  const getDailyDataForClass = (cls: string, date: string) => {
      const targetDate = new Date(date);
      const classStudents = students.filter(s => s.grade === cls);
      
      // Map English status to Indonesian
      const statusMap: Record<string, string> = {
          'present': 'Hadir',
          'sick': 'Sakit',
          'permission': 'Izin',
          'alpha': 'Alpa',
          'late': 'Terlambat'
      };

      return classStudents.map((student, index) => {
          const record = attendance.find(a => 
              a.studentId === student.id && 
              a.timestamp.toDateString() === targetDate.toDateString()
          );
          
          return {
              "No": index + 1,
              "NISN": student.nisn,
              "Name": student.name,
              "Class": student.grade,
              "Date": date,
              "Time In": record ? record.timestamp.toLocaleTimeString() : '-',
              "Status": record ? statusMap[record.status] : 'Tanpa Keterangan'
          };
      });
  };

  const getMonthlyDataForClass = (cls: string, monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const classStudents = students.filter(s => s.grade === cls);
      
      const headers = ['No', 'NISN', 'Name', ...Array.from({length: daysInMonth}, (_, i) => String(i + 1)), 'H', 'S', 'I', 'A'];
      
      const codeMap: Record<string, string> = {
          'present': 'H',
          'late': 'H', // Late counts as present
          'sick': 'S',
          'permission': 'I',
          'alpha': 'A'
      };

      const data = classStudents.map((student, index) => {
          const row: any = {
              "No": index + 1,
              "NISN": student.nisn,
              "Name": student.name
          };

          let countH = 0, countS = 0, countI = 0, countA = 0;

          for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const targetDate = new Date(dateStr);
              const record = attendance.find(a => 
                  a.studentId === student.id && 
                  a.timestamp.toDateString() === targetDate.toDateString()
              );
              
              if (record) {
                  const code = codeMap[record.status] || '.';
                  row[String(d)] = code;
                  if (code === 'H') countH++;
                  else if (code === 'S') countS++;
                  else if (code === 'I') countI++;
                  else if (code === 'A') countA++;
              } else {
                  row[String(d)] = '.';
              }
          }
          
          row['H'] = countH;
          row['S'] = countS;
          row['I'] = countI;
          row['A'] = countA;
          
          return row;
      });

      return { headers, data };
  };

  const handleExportData = (type: 'daily' | 'monthly') => {
      const targetClasses = exportScope === 'all' ? classes : (selectedClass ? [selectedClass] : []);
      
      if (targetClasses.length === 0) {
          alert("Silakan pilih kelas atau pilih 'Semua Kelas'.");
          return;
      }

      if (exportFormat === 'xlsx') {
          // --- EXCEL EXPORT ---
          const wb = XLSX.utils.book_new();

          targetClasses.forEach(cls => {
              let ws;
              if (type === 'daily') {
                  const data = getDailyDataForClass(cls, exportDate);
                  ws = XLSX.utils.json_to_sheet(data);
                  
                  // Set Column Widths for better visibility (in characters)
                  ws['!cols'] = [
                      { wch: 5 },  // No
                      { wch: 15 }, // NISN
                      { wch: 30 }, // Name
                      { wch: 10 }, // Class
                      { wch: 15 }, // Date
                      { wch: 15 }, // Time In
                      { wch: 15 }  // Status
                  ];
              } else {
                  const { headers, data } = getMonthlyDataForClass(cls, exportMonth);
                  ws = XLSX.utils.json_to_sheet(data, { header: headers });

                   // Set Column Widths for Monthly
                   const colWidths = [
                    { wch: 5 },  // No
                    { wch: 15 }, // NISN
                    { wch: 30 }, // Name
                  ];
                  // Add small width for days
                  for(let i=0; i<31; i++) colWidths.push({ wch: 4 }); 
                  // Summary Columns
                  colWidths.push({ wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 });
                  ws['!cols'] = colWidths;
              }
              // Sheet name limited to 31 chars
              const sheetName = cls.slice(0, 31).replace(/[:\/?*\[\]\\]/g, ""); 
              XLSX.utils.book_append_sheet(wb, ws, sheetName);
          });

          const fileName = `Absensi_${type}_${exportScope === 'all' ? 'Semua_Kelas' : selectedClass}_${type === 'daily' ? exportDate : exportMonth}.xlsx`;
          XLSX.writeFile(wb, fileName);

      } else {
          // --- PDF EXPORT ---
          const doc = new jsPDF(type === 'monthly' ? 'l' : 'p'); // Landscape for monthly
          
          targetClasses.forEach((cls, index) => {
              if (index > 0) doc.addPage(); // New page for each class in All Classes mode

              doc.setFontSize(18);
              doc.text(schoolName, 14, 15);
              doc.setFontSize(14);
              doc.text(`Laporan Absensi ${type === 'daily' ? 'Harian' : 'Bulanan'}`, 14, 25);
              doc.setFontSize(11);
              doc.text(`Kelas: ${cls}`, 14, 33);
              doc.text(`Periode: ${type === 'daily' ? exportDate : exportMonth}`, 14, 40);

              if (type === 'daily') {
                  const data = getDailyDataForClass(cls, exportDate);
                  const tableBody = data.map(d => [d['No'], d['NISN'], d['Name'], d['Time In'], d['Status']]);
                  
                  autoTable(doc, {
                      head: [['No', 'NISN', 'Nama', 'Waktu', 'Status']],
                      body: tableBody,
                      startY: 45,
                      theme: 'grid',
                      headStyles: { fillColor: [79, 70, 229] },
                      columnStyles: {
                          0: { cellWidth: 15 }, 
                          // other columns auto width
                      }
                  });
              } else {
                  const { headers, data } = getMonthlyDataForClass(cls, exportMonth);
                  // Monthly table logic
                  const tableHead = headers; 
                  
                  const tableBody = data.map(row => {
                      return tableHead.map(key => row[key]);
                  });

                  autoTable(doc, {
                      head: [tableHead],
                      body: tableBody,
                      startY: 45,
                      theme: 'grid',
                      styles: { fontSize: 7, cellPadding: 1 }, // Smaller font for monthly
                      headStyles: { fillColor: [79, 70, 229] },
                      columnStyles: {
                          0: { cellWidth: 10 }, // No
                          1: { cellWidth: 20 }, // NISN
                          2: { cellWidth: 35 }, // Name
                          // Rest auto
                      },
                      didParseCell: (data) => {
                          // Highlight Weekends (Sat/Sun)
                          if (data.column.index > 2 && data.column.index < tableHead.length - 4) {
                              const day = parseInt(tableHead[data.column.index]);
                              const [year, month] = exportMonth.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              const dayOfWeek = date.getDay();
                              
                              // Sunday (0) or Saturday (6)
                              if (dayOfWeek === 0 || dayOfWeek === 6) {
                                  if (data.section === 'body') {
                                      data.cell.styles.fillColor = [254, 202, 202]; // Red-200 background
                                  } else if (data.section === 'head') {
                                      data.cell.styles.fillColor = [239, 68, 68]; // Red-500 header
                                  }
                              }
                          }
                      }
                  });
              }
          });

          const fileName = `Absensi_${type}_${exportScope === 'all' ? 'Semua_Kelas' : selectedClass}_${type === 'daily' ? exportDate : exportMonth}.pdf`;
          doc.save(fileName);
      }
  };


  const renderDashboard = () => {
    // Today's Stats
    const today = new Date().toDateString();
    const todaysRecords = attendance.filter(a => a.timestamp.toDateString() === today);
    
    const presentCount = todaysRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const sickCount = todaysRecords.filter(a => a.status === 'sick').length;
    const permissionCount = todaysRecords.filter(a => a.status === 'permission').length;
    const alphaCount = todaysRecords.filter(a => a.status === 'alpha').length;
    
    const totalCount = students.length;
    // Absent here means "No Record Yet" (Not marked as Present, Sick, Permission or Alpha)
    const noInfoCount = totalCount - (presentCount + sickCount + permissionCount + alphaCount);
    
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    const classAnalytics = classes.map(cls => {
      const studentsInClass = students.filter(s => s.grade === cls);
      const totalInClass = studentsInClass.length;
      const presentInClass = studentsInClass.filter(s => 
        attendance.some(a => a.studentId === s.id && (a.status === 'present' || a.status === 'late'))
      ).length;
      const rate = totalInClass > 0 ? Math.round((presentInClass / totalInClass) * 100) : 0;
      return { className: cls, present: presentInClass, total: totalInClass, rate };
    }).sort((a, b) => b.rate - a.rate);

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{getGreeting()}, Admin 👋</h1>
            <p className="text-gray-500 mt-1">Berikut adalah ringkasan absensi untuk hari ini.</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl w-full md:w-auto mt-4 md:mt-0">
             <div className="p-2 bg-indigo-200 rounded-full shrink-0">
                <Clock className="w-5 h-5 text-indigo-700" />
             </div>
             <div>
                <div className="text-xl font-bold text-indigo-900 font-mono leading-tight">
                  {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg col-span-2 md:col-span-1">
            <h3 className="text-indigo-100 font-medium mb-1 text-sm">Tingkat Kehadiran</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{percentage}%</span>
              <div className="p-1.5 bg-white/20 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wide">Hadir</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800">{presentCount}</span>
              <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
          
           <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wide">Sakit</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800">{sickCount}</span>
              <div className="p-1.5 bg-yellow-50 rounded-lg text-yellow-600">
                <Stethoscope className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wide">Izin</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800">{permissionCount}</span>
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wide">Alpa</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800">{alphaCount}</span>
              <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 md:col-span-1">
             <h3 className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wide">Tanpa Keterangan</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-800">{noInfoCount}</span>
               <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                <FileQuestion className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ... Charts ... */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Performa Kelas</h2>
                        <p className="text-sm text-gray-500">Kehadiran berdasarkan kelas</p>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                </div>
                <div className="space-y-5 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                    {classAnalytics.length > 0 ? (
                        classAnalytics.map((stat) => (
                            <div key={stat.className} className="group">
                                <div className="flex justify-between items-end mb-1">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-700">{stat.className}</span>
                                        <span className="text-xs text-gray-400">{stat.present} dari {stat.total} hadir</span>
                                    </div>
                                    <span className={`font-bold text-sm ${
                                        stat.rate === 100 ? 'text-green-600' : 
                                        stat.rate >= 80 ? 'text-indigo-600' : 
                                        stat.rate >= 50 ? 'text-yellow-600' : 'text-red-500'
                                    }`}>
                                        {stat.rate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                            stat.rate === 100 ? 'bg-green-500' : 
                                            stat.rate >= 80 ? 'bg-indigo-500' : 
                                            stat.rate >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                                        }`} 
                                        style={{ width: `${stat.rate}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Tidak ada data kelas tersedia.
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-lg font-bold text-gray-800">Aktivitas Langsung</h2>
                <button 
                  onClick={() => setView('scan')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Scan Baru
                </button>
              </div>
              <div className="divide-y divide-gray-50 overflow-y-auto flex-1 custom-scrollbar">
                {attendance.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <QrCode className="w-6 h-6 text-gray-300" />
                    </div>
                    <p>Belum ada rekaman absensi hari ini.</p>
                  </div>
                ) : (
                  attendance.slice(0, 10).map(record => {
                    const student = students.find(s => s.id === record.studentId);
                    
                    let statusColor = 'bg-green-50 text-green-700 border-green-100';
                    let statusText = 'Hadir';
                    if (record.status === 'sick') { statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-100'; statusText = 'Sakit'; }
                    else if (record.status === 'permission') { statusColor = 'bg-blue-50 text-blue-700 border-blue-100'; statusText = 'Izin'; }
                    else if (record.status === 'alpha') { statusColor = 'bg-red-50 text-red-700 border-red-100'; statusText = 'Alpa'; }

                    return (
                      <div key={record.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                        <img 
                          src={student?.avatar} 
                          alt={student?.name} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{student?.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                               {student?.grade}
                             </span>
                             <span className="text-xs text-gray-400">
                               {record.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded text-center min-w-[60px] border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
        </div>
      </div>
    );
  };
  
  const renderScan = () => {
    // Determine the specific record for the last scanned student to get accurate time
    const lastRecord = lastScanned ? attendance.find(a => 
      a.studentId === lastScanned.id && 
      a.timestamp.toDateString() === new Date().toDateString()
    ) : null;
    
    // Use the record's timestamp if available, otherwise current time (fallback)
    const displayTime = lastRecord ? lastRecord.timestamp : new Date();

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-24 md:pb-0">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Scan Absensi</h2>
          <p className="text-gray-500 text-sm">Arahkan kamera ke QR Code Siswa</p>
        </div>

        {/* Scanner Section */}
        <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100">
             {lastScanned ? (
                 <div className="flex flex-col items-center py-6 px-4 text-center space-y-4 animate-scaleIn">
                    
                    {/* AVATAR & STATUS ICON */}
                    <div className="relative mb-2">
                        <img 
                            src={lastScanned.avatar} 
                            alt={lastScanned.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                         <div className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-white ${scanMessage?.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {scanMessage?.type === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                            ) : (
                                <XCircle className="w-4 h-4 text-white" />
                            )}
                        </div>
                    </div>

                    {/* Greeting */}
                    {scanMessage?.type === 'success' && (
                        <div className="-mt-2">
                            <h2 className="text-xl font-bold text-gray-800">
                                {getGreeting()}, {lastScanned.name.split(' ')[0]}!
                            </h2>
                            <p className="text-gray-500 text-sm">Absensi berhasil dicatat.</p>
                        </div>
                    )}

                    {/* COMPACT FROZEN TIME DISPLAY */}
                    <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 w-auto inline-flex flex-col items-center justify-center min-w-[120px]">
                        <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">Waktu Masuk</p>
                        <p className="text-xl font-mono font-bold text-indigo-700">
                            {displayTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')} WIB
                        </p>
                    </div>
                    
                    {/* STUDENT DETAILS */}
                    <div className="bg-gray-50 p-4 rounded-xl w-full border border-gray-100">
                        <h3 className="font-bold text-gray-800">{lastScanned.name}</h3>
                        <div className="flex justify-center gap-3 text-sm text-gray-500 mt-1">
                             <span className="font-mono">{lastScanned.nisn}</span>
                             <span>•</span>
                             <span>{lastScanned.grade}</span>
                        </div>
                    </div>

                    {/* STATUS TEXT */}
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium w-full ${scanMessage?.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {scanMessage?.text}
                    </div>

                    {/* WhatsApp Notification Button */}
                    {lastScanned.parentPhone && scanMessage?.type === 'success' && (
                        <div className="w-full max-w-xs space-y-2">
                            {waConfig.mode === 'gateway' && waConfig.autoSend ? (
                                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 animate-pulse border border-emerald-100">
                                    <Send className="w-4 h-4" /> Notifikasi WhatsApp terkirim otomatis
                                </div>
                            ) : (
                                <button 
                                    onClick={() => sendWhatsAppNotification(lastScanned, displayTime)}
                                    disabled={isSendingWA}
                                    className={`w-full px-6 py-3 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                                        waConfig.mode === 'gateway' 
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                                            : 'bg-green-500 hover:bg-green-600 shadow-green-100'
                                    }`}
                                >
                                    {isSendingWA ? (
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <MessageCircle className="w-5 h-5" /> 
                                    )}
                                    {waConfig.mode === 'gateway' ? 'Kirim Notifikasi (Gateway)' : 'Beritahu Orang Tua (WA)'}
                                </button>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={handleNextStudent}
                        className="mt-2 w-full max-w-xs px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        Scan Berikutnya <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
             ) : (
                 <QRScanner onScan={handleQRScan} />
             )}
        </div>

        {/* Manual Input Fallback */}
        {!lastScanned && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-gray-400" /> Input Manual
                </h3>
                <form onSubmit={handleManualSubmit} className="flex gap-3">
                    <div className="relative flex-1">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <QrCode className="h-5 w-5 text-gray-400" />
                         </div>
                        <input
                            ref={manualInputRef}
                            type="text"
                            value={manualInput}
                            onChange={(e) => {
                                const val = e.target.value;
                                setManualInput(val);
                                // Auto-submit if length is 10 (NISN standard)
                                if (val.length === 10) {
                                    handleQRScan(val);
                                    setManualInput('');
                                }
                            }}
                            placeholder="Masukkan NISN atau ID Siswa..."
                            className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!manualInput.trim()}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        Submit
                    </button>
                </form>
                <p className="text-xs text-gray-400 mt-3 text-center">
                    Gunakan ini jika QR code rusak atau tidak terbaca.
                </p>
            </div>
        )}
      </div>
    );
  };

  const renderManualAttendance = () => {
    // Filter logic:
    // 1. Must be in selected class
    // 2. Must NOT have an attendance record for TODAY
    const filteredStudents = selectedClass 
      ? students.filter(s => {
          if (s.grade !== selectedClass) return false;
          
          const today = new Date().toDateString();
          const hasRecord = attendance.some(a => 
              a.studentId === s.id && 
              a.timestamp.toDateString() === today
          );
          
          return !hasRecord;
      })
      : [];

    return (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Absensi Manual</h2>
            <p className="text-gray-500 text-sm">Tandai absensi untuk siswa yang tidak hadir (Sakit, Izin, Alpha)</p>
          </div>
        </div>

        {/* Class Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
            {classes.map(cls => (
                <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                        selectedClass === cls 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                    }`}
                >
                    {cls}
                </button>
            ))}
        </div>

        {selectedClass ? (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-gray-800 text-lg">{selectedClass}</h3>
                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
                            {filteredStudents.length} Belum Absen
                        </span>
                    </div>
                </div>

                {filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredStudents.map(student => (
                            <StudentCard 
                                key={student.id} 
                                student={student} 
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                attendanceStatus={null} // Always null here as we filtered out present ones
                                onMarkAttendance={handleMarkAttendance}
                                hideDownloadButton={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-green-50 rounded-2xl border-2 border-dashed border-green-200">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-gray-900 font-medium">Semua siswa sudah tercatat!</h3>
                        <p className="text-gray-500 text-sm mt-1">Setiap siswa di kelas ini memiliki rekaman absensi untuk hari ini.</p>
                    </div>
                )}
            </div>
        ) : (
             <div className="text-center py-20">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <School className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Pilih Kelas</h3>
                <p className="text-gray-500 mt-2">Pilih kelas untuk melihat siapa yang belum absen.</p>
             </div>
        )}
      </div>
    );
  };

  const renderStudents = () => {
    const filteredStudents = selectedClass 
      ? students.filter(s => s.grade === selectedClass)
      : [];

    return (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Data Siswa</h2>
            <p className="text-gray-500 text-sm">Kelola data siswa dan kelas</p>
          </div>
          <div className="flex gap-2">
            <button
               onClick={() => setShowAddClassModal(true)}
               className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Kelas
            </button>
          </div>
        </div>

        {/* Class Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
            {classes.map(cls => (
                <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                        selectedClass === cls 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                    }`}
                >
                    {cls}
                </button>
            ))}
        </div>

        {selectedClass ? (
            <div className="space-y-6">
                {/* ... Class Controls (Import/Template/Rename/Delete/Add) ... */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <h3 className="font-bold text-gray-800 text-lg">{selectedClass}</h3>
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold">
                            {filteredStudents.length} Siswa
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                         <div className="relative flex-1 sm:flex-none">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleImportExcel}
                                className="hidden"
                                id="excel-upload"
                                ref={fileInputRef}
                            />
                            <label 
                                htmlFor="excel-upload"
                                className={`px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-green-100 transition-colors flex items-center justify-center gap-2 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {isImporting ? <span className="animate-spin">⌛</span> : <FileSpreadsheet className="w-4 h-4" />}
                                <span className="sm:hidden lg:inline">Import</span>
                            </label>
                        </div>
                        <button
                           onClick={handleDownloadTemplate}
                           className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                           title="Download Template"
                        >
                           <Download className="w-4 h-4" /> 
                           <span className="sm:hidden lg:inline">Format</span>
                        </button>
                        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                        <button
                           onClick={() => openRenameModal(selectedClass)}
                           className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                           title="Ganti Nama Kelas"
                        >
                           <Pencil className="w-4 h-4" />
                        </button>
                        <button
                           onClick={() => openDeleteModal(selectedClass)}
                           className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                           title="Hapus Kelas"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                         <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                         <button
                           onClick={handleAddNewStudent}
                           className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                           <Plus className="w-4 h-4" /> Tambah
                        </button>
                    </div>
                </div>

                {filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredStudents.map(student => {
                            // Find today's attendance status just to show badge, but NO controls
                            const todayRecord = attendance.find(a => 
                                a.studentId === student.id && 
                                a.timestamp.toDateString() === new Date().toDateString()
                            );
                            
                            return (
                                <StudentCard 
                                    key={student.id} 
                                    student={student} 
                                    schoolName={schoolName}
                                    schoolLogo={schoolLogo}
                                    attendanceStatus={todayRecord ? todayRecord.status : null}
                                    onEdit={handleEditStudent}
                                    onDelete={openDeleteStudentModal}
                                    showQrCode={false}
                                    // NO onMarkAttendance prop here!
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-gray-900 font-medium">Belum ada siswa di kelas ini</h3>
                        <p className="text-gray-500 text-sm mt-1">Tambah siswa atau import dari Excel untuk memulai.</p>
                    </div>
                )}
            </div>
        ) : (
             <div className="text-center py-20">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <School className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Pilih Kelas</h3>
                <p className="text-gray-500 mt-2">Pilih kelas dari daftar di atas atau buat kelas baru.</p>
             </div>
        )}
      </div>
    );
  };
  
  const renderReport = () => {
    const [year, month] = exportMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    return (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Laporan & Rekap</h2>
            <p className="text-gray-500 text-sm">Unduh rekap absensi atau buat laporan otomatis dengan AI.</p>
          </div>
        </div>

        {/* Class Selector */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Pilih Kelas</h3>
            <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
                {classes.map(cls => (
                    <button
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                            selectedClass === cls 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                        }`}
                    >
                        {cls}
                    </button>
                ))}
            </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-800">Export Data Absensi</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Daily Report Config */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Laporan Harian</label>
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            value={exportDate}
                            onChange={(e) => setExportDate(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                         <button 
                            onClick={() => handleExportData('daily')}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Download
                        </button>
                    </div>
                </div>

                {/* Monthly Report Config */}
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Laporan Bulanan</label>
                    <div className="flex gap-2">
                        <input 
                            type="month" 
                            value={exportMonth}
                            onChange={(e) => setExportMonth(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                         <button 
                            onClick={() => handleExportData('monthly')}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Download
                        </button>
                    </div>
                </div>
             </div>

             <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cakupan Kelas</label>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                        <button 
                            onClick={() => setExportScope('current')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${exportScope === 'current' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Kelas Terpilih ({selectedClass || 'None'})
                        </button>
                        <button 
                            onClick={() => setExportScope('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${exportScope === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Semua Kelas
                        </button>
                    </div>
                </div>
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format File</label>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                        <button 
                            onClick={() => setExportFormat('xlsx')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${exportFormat === 'xlsx' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Excel (.xlsx)
                        </button>
                        <button 
                            onClick={() => setExportFormat('pdf')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${exportFormat === 'pdf' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            PDF Document
                        </button>
                    </div>
                </div>
             </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Preview Laporan</h3>
                <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
                     <button 
                        onClick={() => setReportViewType('daily')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${reportViewType === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Harian
                    </button>
                    <button 
                        onClick={() => setReportViewType('monthly')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${reportViewType === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Bulanan
                    </button>
                </div>
            </div>
            
            {selectedClass ? (
                <div className="overflow-x-auto">
                    {reportViewType === 'daily' ? (
                        // Render Daily Table
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-4">No</th>
                                    <th className="py-3 px-4">NISN</th>
                                    <th className="py-3 px-4">Nama</th>
                                    <th className="py-3 px-4">Waktu Masuk</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {getDailyDataForClass(selectedClass, exportDate).map((row: any, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">{row.No}</td>
                                        <td className="py-3 px-4 font-mono text-xs">{row.NISN}</td>
                                        <td className="py-3 px-4 font-medium text-gray-800">{row.Name}</td>
                                        <td className="py-3 px-4">{row['Time In']}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                row.Status === 'Hadir' ? 'bg-green-50 text-green-700' :
                                                row.Status === 'Sakit' ? 'bg-yellow-50 text-yellow-700' :
                                                row.Status === 'Izin' ? 'bg-blue-50 text-blue-700' :
                                                row.Status === 'Alpa' ? 'bg-red-50 text-red-700' :
                                                'bg-gray-50 text-gray-500'
                                            }`}>
                                                {row.Status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                 {getDailyDataForClass(selectedClass, exportDate).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-400">Tidak ada data untuk tanggal ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        // Render Monthly Table
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                     <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                        <th className="p-2 border-r border-gray-100 min-w-[40px]">No</th>
                                        <th className="p-2 border-r border-gray-100 min-w-[150px]">Nama</th>
                                        {Array.from({length: daysInMonth}, (_, i) => i + 1).map(d => (
                                            <th key={d} className="p-1 text-center border-r border-gray-100 min-w-[24px]">{d}</th>
                                        ))}
                                        <th className="p-1 text-center bg-green-50 text-green-700 border-r border-gray-100">H</th>
                                        <th className="p-1 text-center bg-yellow-50 text-yellow-700 border-r border-gray-100">S</th>
                                        <th className="p-1 text-center bg-blue-50 text-blue-700 border-r border-gray-100">I</th>
                                        <th className="p-1 text-center bg-red-50 text-red-700">A</th>
                                     </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                     {getMonthlyDataForClass(selectedClass, exportMonth).data.map((row: any, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-2 border-r border-gray-100">{row.No}</td>
                                            <td className="p-2 border-r border-gray-100 font-medium truncate max-w-[150px]" title={row.Name}>{row.Name}</td>
                                            {Array.from({length: daysInMonth}, (_, i) => i + 1).map(d => (
                                                <td key={d} className={`p-1 text-center border-r border-gray-100 ${
                                                    row[String(d)] === 'H' ? 'bg-green-50 text-green-600 font-bold' :
                                                    row[String(d)] === 'S' ? 'bg-yellow-50 text-yellow-600 font-bold' :
                                                    row[String(d)] === 'I' ? 'bg-blue-50 text-blue-600 font-bold' :
                                                    row[String(d)] === 'A' ? 'bg-red-50 text-red-600 font-bold' :
                                                    'text-gray-300'
                                                }`}>
                                                    {row[String(d)]}
                                                </td>
                                            ))}
                                            <td className="p-1 text-center font-bold text-green-700 bg-green-50/30 border-r border-gray-100">{row.H}</td>
                                            <td className="p-1 text-center font-bold text-yellow-700 bg-yellow-50/30 border-r border-gray-100">{row.S}</td>
                                            <td className="p-1 text-center font-bold text-blue-700 bg-blue-50/30 border-r border-gray-100">{row.I}</td>
                                            <td className="p-1 text-center font-bold text-red-700 bg-red-50/30">{row.A}</td>
                                        </tr>
                                     ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400">
                    Pilih kelas terlebih dahulu untuk melihat preview laporan.
                </div>
            )}
        </div>

        {/* AI Report Generator */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <ScanFace className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">AI Smart Report</h3>
                        <p className="text-indigo-100 text-sm max-w-lg">
                            Gunakan kecerdasan buatan untuk menganalisis data absensi hari ini dan membuat ringkasan laporan otomatis untuk Kepala Sekolah atau Wali Murid.
                        </p>
                    </div>
                </div>

                {reportText ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 mt-4">
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{reportText}</ReactMarkdown>
                        </div>
                        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                            <button 
                                onClick={() => navigator.clipboard.writeText(reportText)}
                                className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2"
                            >
                                <ClipboardList className="w-4 h-4" /> Salin Teks
                            </button>
                             <button 
                                onClick={() => setReportText("")}
                                className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/30 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Buat Ulang
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={handleGenerateReport}
                        disabled={reportLoading}
                        className="mt-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {reportLoading ? (
                             <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <ScanFace className="w-5 h-5" />
                        )}
                        {reportLoading ? 'Sedang Menganalisis...' : 'Generate Laporan Harian'}
                    </button>
                )}
            </div>
        </div>
      </div>
    );
  };
  
  const renderSettings = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-24 md:pb-0">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pengaturan Sekolah</h2>
                <p className="text-gray-500 text-sm">Perbarui informasi, logo, dan koneksi WhatsApp</p>
            </div>

            <div className="space-y-6">
                {/* School Identity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <School className="w-5 h-5 text-indigo-600" /> Identitas Sekolah
                    </h3>
                    
                    {/* School Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Sekolah</label>
                        <input 
                            type="text" 
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-800"
                            placeholder="Contoh: SMA Negeri 1 Jakarta"
                        />
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo Sekolah</label>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {schoolLogo ? (
                                        <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <School className="w-12 h-12 text-gray-300" />
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    id="logo-upload"
                                    ref={logoInputRef}
                                />
                                <div className="flex gap-3">
                                    <label 
                                        htmlFor="logo-upload"
                                        className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" /> Upload Logo
                                    </label>
                                    {schoolLogo && (
                                        <button 
                                            onClick={() => { setSchoolLogo(null); if(logoInputRef.current) logoInputRef.current.value = ""; }}
                                            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Hapus
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Format yang disarankan: PNG atau JPG transparan (Maks. 2MB)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Server className="w-5 h-5 text-purple-600" /> Pengaturan Database
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <h4 className="font-bold text-purple-900 mb-2">Backup & Restore</h4>
                            <p className="text-xs text-purple-700 mb-4">
                                Unduh cadangan data siswa dan absensi, atau pulihkan dari file cadangan sebelumnya.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => {
                                        const data = {
                                            students,
                                            attendance,
                                            classes,
                                            schoolName,
                                            waConfig
                                        };
                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `siabdul_backup_${new Date().toISOString().split('T')[0]}.json`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="w-full py-2 bg-white text-purple-700 border border-purple-200 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download Backup
                                </button>
                                <label className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                    <Upload className="w-4 h-4" /> Restore Data
                                    <input 
                                        type="file" 
                                        accept=".json"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (evt) => {
                                                    try {
                                                        const data = JSON.parse(evt.target?.result as string);
                                                        if (confirm("Apakah Anda yakin ingin memulihkan data? Data saat ini akan ditimpa.")) {
                                                            if (data.students) setStudents(data.students);
                                                            if (data.attendance) setAttendance(data.attendance.map((a: any) => ({...a, timestamp: new Date(a.timestamp)})));
                                                            if (data.classes) setClasses(data.classes);
                                                            if (data.schoolName) setSchoolName(data.schoolName);
                                                            if (data.waConfig) setWaConfig(data.waConfig);
                                                            alert("Data berhasil dipulihkan!");
                                                        }
                                                    } catch (err) {
                                                        alert("File backup tidak valid.");
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                            <h4 className="font-bold text-red-900 mb-2">Zona Bahaya</h4>
                            <p className="text-xs text-red-700 mb-4">
                                Hapus semua data siswa atau reset seluruh aplikasi ke pengaturan awal.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => {
                                        if (confirm("Yakin ingin menghapus SEMUA data absensi? Data siswa tidak akan hilang.")) {
                                            setAttendance([]);
                                            alert("Data absensi telah dikosongkan.");
                                        }
                                    }}
                                    className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Reset Absensi
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm("PERINGATAN: Ini akan menghapus SEMUA data siswa, kelas, dan absensi. Aplikasi akan kembali kosong. Lanjutkan?")) {
                                            setStudents([]);
                                            setAttendance([]);
                                            setClasses([]);
                                            alert("Aplikasi telah di-reset sepenuhnya.");
                                        }
                                    }}
                                    className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4" /> Reset Total
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Gateway Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <MessageCircle className="w-5 h-5 text-green-600" /> WhatsApp Gateway
                    </h3>
                    
                    {/* Mode Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pengiriman</label>
                        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                            <button
                                onClick={() => setWaConfig(prev => ({ ...prev, mode: 'link' }))}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                    waConfig.mode === 'link' 
                                    ? 'bg-white shadow-sm text-green-600 ring-1 ring-gray-200' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                <Link className="w-4 h-4" /> Manual Link (wa.me)
                            </button>
                            <button
                                onClick={() => setWaConfig(prev => ({ ...prev, mode: 'gateway' }))}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                    waConfig.mode === 'gateway' 
                                    ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-gray-200' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                <Server className="w-4 h-4" /> Gateway API
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 ml-1">
                            {waConfig.mode === 'link' 
                                ? 'Membuka aplikasi WhatsApp saat tombol diklik. Tidak memerlukan biaya tambahan.' 
                                : 'Mengirim pesan secara otomatis. Gunakan menu "WhatsApp Gateway" di sidebar untuk konfigurasi tanpa API Key.'}
                        </p>
                    </div>

                    {/* Gateway Config Fields (Only if Gateway Mode) */}
                    {waConfig.mode === 'gateway' && (
                        <div className="space-y-4 animate-fadeIn border-t border-gray-100 pt-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                                <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-blue-800">Gunakan Gateway Internal</h4>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Anda tidak perlu mengisi API Key jika menggunakan fitur <b>WhatsApp Gateway</b> di menu sidebar. 
                                        Cukup hubungkan perangkat Anda di sana.
                                    </p>
                                </div>
                            </div>

                            {/* Auto Send Toggle */}
                            <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 transition-colors hover:bg-gray-100">
                                <div className="flex items-center h-5 mt-0.5">
                                    <input
                                        id="autoSend"
                                        type="checkbox"
                                        checked={waConfig.autoSend}
                                        onChange={(e) => setWaConfig(prev => ({ ...prev, autoSend: e.target.checked }))}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </div>
                                <label htmlFor="autoSend" className="flex-1 text-sm cursor-pointer select-none">
                                    <span className="font-medium text-gray-700 flex items-center gap-2">
                                        Kirim Pesan Otomatis saat Scan
                                        {waConfig.autoSend && <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                    </span>
                                    <p className="text-gray-500 text-xs mt-0.5">
                                        Jika diaktifkan, pesan WhatsApp akan langsung dikirim ke orang tua saat siswa melakukan scan, tanpa perlu menekan tombol manual.
                                    </p>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API URL Endpoint (Opsional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Globe className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={waConfig.apiUrl}
                                        onChange={(e) => setWaConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                                        className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-mono"
                                        placeholder="https://api.fonnte.com/send"
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Token (Opsional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Settings className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={waConfig.apiKey}
                                        onChange={(e) => setWaConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                                        className="w-full pl-10 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-mono"
                                        placeholder="Kosongkan jika menggunakan Gateway Internal"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={() => alert("Pengaturan berhasil disimpan!")}
                        className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-gray-200 transition-all flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" /> Simpan Semua Pengaturan
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // --- Main Render ---

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50">
         <div className="p-6 flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl">
                 <QrCode className="w-6 h-6 text-white" />
             </div>
             <div>
                 <h1 className="font-bold text-gray-800 text-lg leading-tight">SIABDUL</h1>
                 <p className="text-xs text-gray-400">Admin Dashboard</p>
             </div>
         </div>
         
         <nav className="flex-1 px-4 py-4 space-y-1">
             <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                 <LayoutDashboard className="w-5 h-5" /> Beranda
             </button>
             <button onClick={() => setView('scan')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'scan' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                 <ScanFace className="w-5 h-5" /> Scan Absensi
             </button>
             <button onClick={() => setView('manual-attendance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'manual-attendance' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                 <ClipboardList className="w-5 h-5" /> Absensi Manual
             </button>
             <button onClick={() => setView('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'students' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                 <Users className="w-5 h-5" /> Data Siswa
             </button>
             <button onClick={() => setView('report')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'report' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                 <BarChart3 className="w-5 h-5" /> Laporan
             </button>
             <button onClick={() => setView('wa-gateway')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'wa-gateway' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                 <Smartphone className="w-5 h-5" /> WhatsApp Gateway
             </button>
             <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${view === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                 <Settings className="w-5 h-5" /> Pengaturan
             </button>
         </nav>
         
         <div className="p-4 border-t border-gray-100">
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                 <LogOut className="w-5 h-5" /> Keluar
             </button>
         </div>
      </aside>
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-600 p-1.5 rounded-lg">
                 <QrCode className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-gray-800">SIABDUL</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
             {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-white pt-16 px-6 animate-fadeIn">
              <nav className="space-y-2">
                 <button onClick={() => {setView('dashboard'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                     <LayoutDashboard className="w-6 h-6" /> Beranda
                 </button>
                 <button onClick={() => {setView('scan'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg ${view === 'scan' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                     <ScanFace className="w-6 h-6" /> Scan Absensi
                 </button>
                 <button onClick={() => {setView('manual-attendance'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg ${view === 'manual-attendance' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                     <ClipboardList className="w-6 h-6" /> Absensi Manual
                 </button>
                 <button onClick={() => {setView('students'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg ${view === 'students' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                     <Users className="w-6 h-6" /> Data Siswa
                 </button>
                 <button onClick={() => {setView('report'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg ${view === 'report' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                     <BarChart3 className="w-6 h-6" /> Laporan
                 </button>
                 <button onClick={() => {setView('wa-gateway'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg ${view === 'wa-gateway' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                     <Smartphone className="w-6 h-6" /> WhatsApp Gateway
                 </button>
                 <button onClick={() => {setView('settings'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg ${view === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>
                     <Settings className="w-6 h-6" /> Pengaturan
                 </button>
                 <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-lg text-red-500 mt-8 border-t border-gray-100">
                     <LogOut className="w-6 h-6" /> Keluar
                 </button>
              </nav>
          </div>
      )}

      {/* Main Content Area */}
      <main className="md:ml-64 p-4 md:p-8 max-w-7xl mx-auto">
        {view === 'dashboard' && renderDashboard()}
        {view === 'scan' && renderScan()}
        {view === 'manual-attendance' && renderManualAttendance()}
        {view === 'students' && renderStudents()}
        {view === 'report' && renderReport()}
        {view === 'settings' && renderSettings()}
        {view === 'wa-gateway' && <WhatsAppGateway />}
        {view === 'student-form' && (
            <StudentForm 
                initialData={editingStudent}
                onSave={handleSaveStudent}
                onCancel={() => {
                    setView('students');
                    setEditingStudent(null);
                }}
                availableClasses={classes}
                preSelectedClass={selectedClass}
            />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-40 pb-safe">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 p-2 ${view === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}>
             <LayoutDashboard className="w-6 h-6" />
             <span className="text-[10px] font-medium">Beranda</span>
        </button>
        <button onClick={() => setView('scan')} className={`flex flex-col items-center gap-1 p-2 -mt-8`}>
             <div className={`p-4 rounded-full shadow-lg ${view === 'scan' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-400 border border-gray-100'}`}>
                <ScanFace className="w-7 h-7" />
             </div>
             <span className={`text-[10px] font-medium ${view === 'scan' ? 'text-indigo-600' : 'text-gray-400'}`}>Scan</span>
        </button>
        <button onClick={() => setView('manual-attendance')} className={`flex flex-col items-center gap-1 p-2 ${view === 'manual-attendance' ? 'text-indigo-600' : 'text-gray-400'}`}>
             <ClipboardList className="w-6 h-6" />
             <span className="text-[10px] font-medium">Manual</span>
        </button>
      </div>

      {/* --- Modals --- */}
      
      {/* Add Class Modal */}
      <Modal isOpen={showAddClassModal} onClose={() => setShowAddClassModal(false)} title="Tambah Kelas Baru">
         <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                <input 
                    type="text" 
                    value={inputClassName}
                    onChange={(e) => setInputClassName(e.target.value)}
                    placeholder="Contoh: 10 IPA 1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                />
            </div>
            <button 
                onClick={confirmAddClass}
                disabled={!inputClassName.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
                Buat Kelas
            </button>
         </div>
      </Modal>

      {/* Rename Class Modal */}
      <Modal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title={`Ganti Nama ${currentClassAction}`}>
         <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Baru</label>
                <input 
                    type="text" 
                    value={inputClassName}
                    onChange={(e) => setInputClassName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                />
            </div>
            <button 
                onClick={confirmRenameClass}
                disabled={!inputClassName.trim() || inputClassName === currentClassAction}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
                Simpan Perubahan
            </button>
         </div>
      </Modal>

      {/* Delete Class Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hapus Kelas">
         <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            {deleteRestriction ? (
                <>
                    <h4 className="font-bold text-gray-800">Tidak Bisa Menghapus Kelas</h4>
                    <p className="text-sm text-gray-500">{deleteRestriction}</p>
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Oke, Saya Mengerti
                    </button>
                </>
            ) : (
                <>
                     <h4 className="font-bold text-gray-800">Apakah Anda yakin?</h4>
                     <p className="text-sm text-gray-500">Anda akan menghapus <span className="font-bold text-gray-800">"{currentClassAction}"</span>. Tindakan ini tidak dapat dibatalkan.</p>
                     <div className="flex gap-3">
                        <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={confirmDeleteClass}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                        >
                            Hapus
                        </button>
                     </div>
                </>
            )}
         </div>
      </Modal>

      {/* Delete Student Modal */}
       <Modal isOpen={showDeleteStudentModal} onClose={() => setShowDeleteStudentModal(false)} title="Hapus Siswa">
         <div className="space-y-4 text-center">
             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
            </div>
             <h4 className="font-bold text-gray-800">Hapus Siswa?</h4>
             <p className="text-sm text-gray-500">
                 Apakah Anda yakin ingin menghapus <span className="font-bold text-gray-800">{studentToDelete?.name}</span>? 
                 Semua riwayat absensi siswa ini juga akan dihapus.
             </p>
             <div className="flex gap-3">
                <button 
                    onClick={() => setShowDeleteStudentModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    Batal
                </button>
                <button 
                    onClick={confirmDeleteStudent}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                    Hapus Siswa
                </button>
             </div>
         </div>
       </Modal>
    </div>
  );
};

export default App;
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Save, X, User, Camera, Phone, Hash } from 'lucide-react';
import { Student } from '../types';

interface StudentFormProps {
  initialData?: Student | null;
  onSave: (student: Student) => void;
  onCancel: () => void;
  availableClasses: string[];
  preSelectedClass?: string | null;
}

const StudentForm: React.FC<StudentFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel,
  availableClasses,
  preSelectedClass
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [nisn, setNisn] = useState(initialData?.nisn || '');
  const [grade, setGrade] = useState(initialData?.grade || preSelectedClass || (availableClasses[0] || ''));
  const [avatar, setAvatar] = useState(initialData?.avatar || '');
  const [parentPhone, setParentPhone] = useState(initialData?.parentPhone || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialData && preSelectedClass) {
        setGrade(preSelectedClass);
    }
  }, [preSelectedClass, initialData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = {
      id: initialData?.id || `STU-${Date.now().toString().slice(-4)}`,
      nisn,
      name,
      grade,
      avatar: avatar || 'https://via.placeholder.com/200',
      parentPhone: parentPhone.replace(/\D/g, ''), // Ensure only numbers are saved
    };
    onSave(student);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-5 md:p-8 animate-fadeIn mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {initialData ? 'Edit Siswa' : 'Tambah Siswa Baru'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Photo Section */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="relative group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-50 shadow-inner flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-300" />
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
             <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium transition-colors"
            >
              <Camera className="w-4 h-4" /> Upload / Ambil Foto
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />
            <p className="text-xs text-gray-400">Foto akan ditampilkan di Kartu Pelajar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Contoh: Ahmad Santoso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Contoh: 0012345678"
                />
            </div>
            <p className="text-xs text-gray-400 mt-1">Digunakan untuk pembuatan QR Code</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            >
                <option value="" disabled>Pilih kelas</option>
                {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp Orang Tua</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full pl-10 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: 628123456789"
                />
            </div>
            <p className="text-xs text-gray-400 mt-1">Format: 628xxxxxxxx (Tanpa simbol +)</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors text-center"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!name || !avatar || !grade || !nisn}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Siswa
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
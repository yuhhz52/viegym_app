import React, { useState, useRef } from 'react';
import apiClient from '../../../api/apiClient';

interface Props {
  onUpload: (url: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export default function UploadMedia({ onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')} and ${ALLOWED_VIDEO_TYPES.join(', ')}`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setError(null);
      setPreview(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview(null);
      e.target.value = ''; // Reset input
      return;
    }

    setError(null);
    setFile(selectedFile);
    
    // Create preview for images
    if (ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // apiClient interceptor sẽ tự động xử lý FormData và set Content-Type với boundary
      const res = await apiClient.post<{ result: string }>('/api/media/upload', formData);
      
      if (res.data.result) {
        onUpload(res.data.result);
        setFile(null);
        setPreview(null);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <input 
            ref={fileInputRef}
            type="file" 
            onChange={handleFileChange}
            accept={ALLOWED_TYPES.join(',')}
            disabled={loading}
            className="hidden"
            id="file-upload-input"
          />
          <label 
            htmlFor="file-upload-input"
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
              loading 
                ? 'border-slate-300 bg-slate-100 cursor-not-allowed' 
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">
              {file ? file.name : 'Choose File'}
            </span>
          </label>
        </div>
        
        <button 
          onClick={handleUpload} 
          disabled={loading || !file}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:hover:shadow-md"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Uploading...</span>
            </div>
          ) : 'Upload'}
        </button>
      </div>
      
      {/* Preview */}
      {preview && !error && (
        <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-50 p-2">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-32 object-contain rounded-lg"
          />
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-700 font-medium flex-1">{error}</p>
          </div>
        </div>
      )}
      
      {file && !error && !preview && (
        <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
              <p className="text-xs text-slate-600">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

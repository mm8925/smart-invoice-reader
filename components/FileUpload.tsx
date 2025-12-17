import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      onFileSelect(file);
    }
  }, [onFileSelect, isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer 
        ${isProcessing ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 bg-white'}`}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/png, image/jpeg, application/pdf"
        onChange={handleChange}
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        <div className="p-4 bg-indigo-100 rounded-full mb-4 text-indigo-600">
            {isProcessing ? (
                 <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            ) : (
                <Upload className="w-8 h-8" />
            )}
        </div>
        <h3 className="text-lg font-semibold text-gray-700">
            {isProcessing ? 'Processing Invoice...' : 'Upload Invoice or Receipt'}
        </h3>
        <p className="text-gray-500 mt-2 text-sm">Drag & drop or click to browse</p>
        <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, PDF</p>
      </label>
    </div>
  );
};

export default FileUpload;

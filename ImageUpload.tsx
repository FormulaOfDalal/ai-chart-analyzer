
import React, { useCallback, useState } from 'react';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  currentImagePreview: string | null;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, currentImagePreview }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    } else {
      alert("Please upload an image file.");
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="mb-6">
      <label
        htmlFor="chart-upload"
        className={`
          w-full p-6 border-2 border-dashed rounded-lg cursor-pointer
          flex flex-col items-center justify-center text-center
          transition-all duration-300 ease-in-out
          ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-400 hover:bg-gray-700'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          id="chart-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mb-3 ${isDragging ? 'text-purple-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p className="text-lg font-semibold text-gray-200">
          {currentImagePreview ? "Drag & drop or click to change image" : "Drag & drop chart image here, or click to select"}
        </p>
        <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
      </label>

      {currentImagePreview && (
        <div className="mt-6 p-4 border border-gray-700 rounded-lg bg-gray-800 shadow-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-300 text-center">Chart Preview</h3>
          <img
            src={currentImagePreview}
            alt="Chart preview"
            className="max-w-full max-h-96 mx-auto rounded-md object-contain"
          />
        </div>
      )}
    </div>
  );
};

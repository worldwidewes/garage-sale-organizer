import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader, Camera, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  onFilesSelected?: (files: File[]) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: 'uploading' | 'processing' | 'analyzing' | 'generating' | 'complete';
  uploadMessage?: string;
  className?: string;
  multiple?: boolean;
  pendingFiles?: File[];
}

export default function ImageUpload({ onUpload, onFilesSelected, isUploading, uploadProgress = 0, uploadStatus, uploadMessage, className, multiple = false, pendingFiles = [] }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (onFilesSelected) {
        onFilesSelected(acceptedFiles);
      } else {
        onUpload(acceptedFiles);
      }
    }
  }, [onUpload, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400',
        isUploading && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <div className="w-full max-w-xs mb-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {uploadMessage || (
              uploadStatus === 'uploading' ? 'Uploading image...' :
              uploadStatus === 'processing' ? 'Processing image...' :
              uploadStatus === 'analyzing' ? 'AI analyzing image...' :
              uploadStatus === 'generating' ? 'Generating details...' :
              uploadStatus === 'complete' ? 'Processing complete!' :
              'Uploading and analyzing image...'
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">{uploadProgress}%</p>
          {uploadStatus && uploadStatus !== 'uploading' && (
            <div className="flex items-center justify-center mt-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-sm text-blue-600">
              Drop the {multiple ? 'images' : 'image'} here...
            </p>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Drop {multiple ? 'images' : 'an image'} here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports JPEG, PNG, GIF, WebP (max 10MB {multiple ? 'each' : ''})
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ImageGalleryProps {
  images: Array<{
    id: string;
    filename: string;
    filepath: string;
  }>;
  onDelete?: (imageId: string) => void;
  className?: string;
}

export function ImageGallery({ images, onDelete, className }: ImageGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className={clsx('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4', className)}>
      {images.map((image) => (
        <div key={image.id} className="relative group">
          <img
            src={`/uploads/thumbnails/${image.filename}`}
            alt=""
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              // Fallback to original image if thumbnail doesn't exist
              const target = e.target as HTMLImageElement;
              target.src = `/uploads/images/${image.filename}`;
            }}
          />
          {onDelete && (
            <button
              onClick={() => onDelete(image.id)}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface PendingFilePreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function PendingFilePreview({ files, onRemove, onConfirm, onCancel, className }: PendingFilePreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className={clsx('border border-blue-200 bg-blue-50 rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-blue-900">
            {files.length} Image{files.length > 1 ? 's' : ''} Ready for Upload
          </h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload Images
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="relative group">
            <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 truncate max-w-full px-2">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-white rounded border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Images will be uploaded first. After upload, you can choose to analyze them with AI 
          to get suggested titles, descriptions, categories, and prices.
        </p>
      </div>
    </div>
  );
}
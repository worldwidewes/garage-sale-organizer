import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader } from 'lucide-react';
import clsx from 'clsx';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: 'uploading' | 'processing' | 'analyzing' | 'generating' | 'complete';
  uploadMessage?: string;
  className?: string;
}

export default function ImageUpload({ onUpload, isUploading, uploadProgress = 0, uploadStatus, uploadMessage, className }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: false,
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
            <p className="text-sm text-blue-600">Drop the image here...</p>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports JPEG, PNG, GIF, WebP (max 10MB)
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
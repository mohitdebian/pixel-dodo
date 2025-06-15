import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  className?: string;
}

export function ImageUpload({ onImageSelect, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onImageSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors relative",
        isDragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-600",
        "hover:border-blue-500 hover:bg-blue-500/5",
        className
      )}
    >
      <input {...getInputProps()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      {preview ? (
        <div className="relative aspect-square w-full max-w-md mx-auto">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-contain rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <p className="text-white">Click or drag to replace</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? "Drop your image here" : "Upload an image"}
            </p>
            <p className="text-sm text-gray-400">
              Drag and drop your image here, or click to select
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 
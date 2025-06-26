"use client";

import { useRef } from "react";
import { Button } from "@components/ui";
import { uploadImage } from "@lib/api/upload";

interface PhotoUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
  text?: string;
}

export default function PhotoUpload({ value, onChange, disabled, text }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }
      
      const url = await uploadImage(file);
      onChange?.(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  return (
    <div className="flex items-center gap-4">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Preview"
          className="h-20 w-20 rounded-md object-cover"
        />
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="
            inline-block max-w-xs h-auto
            whitespace-normal break-words
            px-4 py-2
            text-foreground bg-transparent no-underline
            transition-colors border-none
            hover:text-background hover:no-underline hover:bg-brand-from
            focus:ring-0 
          "
        >
          {text || "Upload Photo"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback, Button } from "@components/ui";
import { Input } from "@components/ui/input";
import { uploadAvatar } from "@lib/api/user/user";
import DefaultAvatar from "@components/DefaultAvatar";

interface AvatarUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
}

export default function AvatarUpload({ value, onChange, disabled }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAvatar(file);
    onChange?.(url);
  };

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-20 w-20">
        {value && <AvatarImage src={value} alt="Avatar preview" />}
        <AvatarFallback>
          <DefaultAvatar
            size={80}
            className="border border-brand-to bg-brand-from"
          />
        </AvatarFallback>
      </Avatar>
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Upload
        </Button>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

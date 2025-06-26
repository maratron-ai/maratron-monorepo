// src/components/ui/FormField/TextField.tsx
"use client";

import React from "react";
import { Input, Label } from "@components/ui";

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: React.ReactNode;
  name: string;
  value: string | number;
  editing?: boolean;
  onChange: (name: string, value: string) => void;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  value,
  editing = true,
  onChange,
  className = "",
  ...inputProps
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={name} className="block font-medium">
        {label}
        {inputProps.required && <span className="text-brand-orange-dark ml-1">*</span>}
      </Label>

      {editing ? (
          <Input
            id={name}
            name={name}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(name, e.target.value)
            }
            className="mt-1"
            {...inputProps}
          />
      ) : (
        <p className="mt-1 text-foreground dark:text-foreground">{value ?? "–"}</p>
      )}
    </div>
  );
};

export default TextField;

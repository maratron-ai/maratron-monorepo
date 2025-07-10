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
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
          {inputProps.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {editing ? (
        <Input
          id={name}
          name={name}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(name, e.target.value)
          }
          className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-300 dark:focus:ring-zinc-600"
          {...inputProps}
        />
      ) : (
        <p className="mt-1 text-zinc-900 dark:text-zinc-100">{value ?? "–"}</p>
      )}
    </div>
  );
};

export default TextField;

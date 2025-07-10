"use client";

import React from "react";
import { Label, Textarea } from "@components/ui";

export interface TextAreaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  name: string;
  value: string;
  editing?: boolean;
  onChange: (name: string, value: string) => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  editing = true,
  onChange,
  className = "",
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {editing ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-300 dark:focus:ring-zinc-600"
          {...props}
        />
      ) : (
        <p className="mt-1 text-zinc-900 dark:text-zinc-100">{value ?? "–"}</p>
      )}
    </div>
  );
};

export default TextAreaField;

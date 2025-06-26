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
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={name} className="block font-medium">
        {label}
        {props.required && <span className="text-brand-orange-dark ml-1">*</span>}
      </Label>

      {editing ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="mt-1"
          {...props}
        />
      ) : (
        <p className="mt-1 text-foreground dark:text-foreground">{value ?? "–"}</p>
      )}
    </div>
  );
};

export default TextAreaField;

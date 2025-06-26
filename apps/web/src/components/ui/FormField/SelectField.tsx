"use client";

import React from "react";
import { Label } from "@components/ui";

export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  editing?: boolean;
  onChange: (name: string, value: string) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  value,
  editing = true,
  onChange,
  className = "",
  ...selectProps
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={name} className="block font-medium">
        {label}
        {selectProps.required && <span className="text-brand-orange-dark ml-1">*</span>}
      </Label>

      {editing ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-accent-2 bg-accent-2 opacity-80 px-2 py-1 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-accent-2 focus:ring-offset-2"
          {...selectProps}
        >
          <option value="" disabled>
            Select {label}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-1 text-foreground dark:text-foreground">
          {options.find((opt) => opt.value === value)?.label ?? "–"}
        </p>
      )}
    </div>
  );
};

export default SelectField;

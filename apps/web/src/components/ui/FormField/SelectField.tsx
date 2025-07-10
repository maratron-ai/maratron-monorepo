"use client";

import React from "react";
import { Label } from "@components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

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
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
          {selectProps.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {editing ? (
        <Select
          value={value}
          onValueChange={(newValue) => onChange(name, newValue)}
          {...selectProps}
        >
          <SelectTrigger className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-300 dark:focus:ring-zinc-600">
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700">
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 focus:bg-zinc-100 dark:focus:bg-zinc-700"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="mt-1 text-zinc-900 dark:text-zinc-100">
          {options.find((opt) => opt.value === value)?.label ?? "–"}
        </p>
      )}
    </div>
  );
};

export default SelectField;

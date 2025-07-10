"use client";

import React from "react";
import { Label } from "@components/ui";
import { Checkbox } from "@components/ui/checkbox";

export interface CheckboxGroupFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string[];
  editing?: boolean;
  onChange: (name: string, value: string[]) => void;
}

const CheckboxGroupField: React.FC<CheckboxGroupFieldProps> = ({
  label,
  name,
  options,
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
        <div className="flex flex-wrap gap-4">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <Checkbox
                id={opt.value}
                name={name}
                checked={value.includes(opt.value)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...value, opt.value]
                    : value.filter((v) => v !== opt.value);
                  onChange(name, next);
                }}
                className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900 dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100"
              />
              <Label
                htmlFor={opt.value}
                className="text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-zinc-900 dark:text-zinc-100">
          {value.length > 0 ? value.join(", ") : "–"}
        </p>
      )}
    </div>
  );
};

export default CheckboxGroupField;

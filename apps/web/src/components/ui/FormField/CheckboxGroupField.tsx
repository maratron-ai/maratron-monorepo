"use client";

import React from "react";
import { Label } from "@components/ui";
import { Input } from "@components/ui/input";

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
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={name} className="block font-medium">
        {label}
        {inputProps.required && <span className="text-brand-orange-dark ml-1">*</span>}
      </Label>

      {editing ? (
        <div className="flex flex-wrap gap-4">
          {options.map((opt) => (
            <label key={opt.value} className="inline-flex items-center">
                <Input
                  id={opt.value}
                  name={name}
                  type="checkbox"
                  {...inputProps}
                  checked={value.includes(opt.value)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const next = e.target.checked
                      ? [...value, opt.value]
                      : value.filter((v) => v !== opt.value);
                    onChange(name, next);
                  }}
                  value={opt.value}
                  className="rounded border-accent text-primary focus:ring-2 focus:ring-primary"
                />
              <span className="ml-2 text-foreground dark:text-foreground">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-foreground dark:text-foreground">
          {value.length > 0 ? value.join(", ") : "–"}
        </p>
      )}
    </div>
  );
};

export default CheckboxGroupField;

"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { Shoe } from "@maratypes/shoe";
import { shoeSchema } from "@lib/schemas/shoeSchema";
import isYupValidationError from "@lib/utils/validation/isYupValidationError";
import { useSession } from "next-auth/react";
import { useUser } from "@hooks/useUser";

import { Card, Button, Spinner, Checkbox, Label } from "@components/ui";
import {
  TextField,
  SelectField,
  TextAreaField,
} from "@components/ui/FormField";

import { DistanceUnit } from "@maratypes/basics";

const distanceUnits: DistanceUnit[] = ["miles", "kilometers"];

interface FormData {
  name: string;
  notes?: string;
  distanceUnit: DistanceUnit;
  maxDistance: number;
  currentDistance: number;
  retired: boolean;
  makeDefault: boolean;
}

interface ShoeFormProps {
  onSubmit: (shoe: Shoe, makeDefault: boolean) => void;
  initialData?: Partial<FormData>;
}

const initialForm: FormData = {
  name: "",
  notes: "",
  distanceUnit: "miles",
  maxDistance: 500,
  currentDistance: 0,
  retired: false,
  makeDefault: false,
};

const ShoeForm: React.FC<ShoeFormProps> = ({ onSubmit, initialData }) => {
  const { data: session, status } = useSession();
  const { profile } = useUser();
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    ...initialData,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>("");

  // Apply user defaults when profile loads
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      distanceUnit: profile?.defaultDistanceUnit || "miles",
    }));
  }, [profile?.defaultDistanceUnit]);

  const handleFieldChange = (
    name: string,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]:
        typeof prev[name as keyof FormData] === "number"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess("");

    try {
      if (!session?.user?.id)
        throw new Error("You must be logged in to add a shoe.");

      const valid = await shoeSchema.validate(form, {
        abortEarly: false,
        stripUnknown: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...rest } = valid;

      const shoe: Shoe = {
        ...rest,
        notes: valid.notes || "",
        userId: session.user.id, // Attach userId from NextAuth session!
      };

      onSubmit(shoe, form.makeDefault);
      setSuccess("Shoe added successfully!");
      setForm({
        ...initialForm,
        distanceUnit: profile?.defaultDistanceUnit || "miles",
        makeDefault: false,
      });
    } catch (err: unknown) {
      if (isYupValidationError(err)) {
        setErrors(err.inner.map((e: Error) => e.message));
      } else if (err instanceof Error) {
        setErrors([err.message]);
      } else {
        setErrors(["An unexpected error occurred."]);
      }
    }
  };

  if (status === "loading")
    return (
      <div className="flex justify-center py-4">
        <Spinner className="h-4 w-4" />
      </div>
    );

  return (
    <Card className="p-6 w-full">
      <h2 className="text-2xl font-semibold mb-4">Add a Shoe</h2>

      {success && <p className="text-primary mb-4">{success}</p>}
      {errors.length > 0 && (
        <div className="space-y-1 mb-4">
          {errors.map((err, i) => (
            <p key={i} className="text-brand-orange-dark text-sm">
              {err}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField
          label="Shoe Name"
          name="name"
          value={form.name}
          onChange={handleFieldChange}
          required
        />

        <TextAreaField
          label="Notes"
          name="notes"
          value={form.notes || ""}
          onChange={handleFieldChange}
          rows={2}
        />

        <SelectField
          label="Distance Unit"
          name="distanceUnit"
          options={distanceUnits.map((u) => ({ value: u, label: u }))}
          value={form.distanceUnit}
          onChange={handleFieldChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Max Distance"
            name="maxDistance"
            type="number"
            min="1"
            value={form.maxDistance}
            onChange={handleFieldChange}
            required
          />
          <TextField
            label="Current Distance"
            name="currentDistance"
            type="number"
            min="0"
            value={form.currentDistance}
            onChange={handleFieldChange}
          />
        </div>

        <div className="flex items-center justify-end space-x-2">
          <Checkbox
            id="makeDefault"
            checked={form.makeDefault}
            onCheckedChange={(checked: boolean) =>
              handleFieldChange("makeDefault", Boolean(checked))
            }
            className="h-4 w-4 bg-foreground text-background"
          />
          <Label htmlFor="makeDefault" className="text-sm">
            Set as default shoe
          </Label>
          <Button
            type="submit"
            className="block text-center py-2 bg-transparent justify-center text-foreground no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
          >
            Add Shoe
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ShoeForm;

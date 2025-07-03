"use client";

import { User } from "@maratypes/user";
import BasicInfoSection from "./BasicInfoSection";
import PhysicalStatsSection from "./PhysicalStatsSection";
import GoalsSection from "./GoalsSection";
import PreferencesSection from "./PreferencesSection";
import CoachSection from "./CoachSection";
import { useUserForm } from "@hooks/useUserForm";
import { Button } from "@components/ui";

interface Props {
  initialUser: User;
  onSave: (u: User) => void;
  /** always show fields in edit mode */
  alwaysEdit?: boolean;
  submitLabel?: string;
  /** show VDOT field when editing */
  showVDOTField?: boolean;
}

export default function UserProfileForm({
  initialUser,
  onSave,
  alwaysEdit = false,
  submitLabel = "Save Profile",
  showVDOTField = true,
}: Props) {
  const {
    formData,
    isEditing,
    validationErrors,
    handleChange,
    handleSave,
    toggleEditing,
  } = useUserForm(initialUser, onSave);
  // if alwaysEdit, override hook state
  const editing = alwaysEdit ? true : isEditing;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center border-b border-accent pb-4">
        <h2 className="text-3xl font-bold text-foreground">Your Profile</h2>
        {!alwaysEdit && (
          <Button
            type="button"
            onClick={toggleEditing}
            className={`px-4 py-2 rounded font-medium ${
              editing
                ? "bg-accent text-foreground hover:bg-accent hover:opacity-80"
                : "bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white border-0 hover:from-[var(--brand-from)] hover:opacity-90 hover:to-[var(--brand-to)] hover:opacity-90"
            }`}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-brand-orange-dark opacity-10 text-brand-orange-dark rounded">
          <ul className="list-disc list-inside">
            {validationErrors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <BasicInfoSection
        formData={formData}
        isEditing={editing}
        onChange={handleChange}
        showVDOTField={showVDOTField}
      />
      <PhysicalStatsSection
        formData={formData}
        isEditing={editing}
        onChange={handleChange}
      />
      <GoalsSection
        formData={formData}
        isEditing={editing}
        onChange={handleChange}
      />
      <PreferencesSection
        formData={formData}
        isEditing={editing}
        onChange={handleChange}
      />
      <CoachSection
        formData={formData}
        isEditing={editing}
        onChange={handleChange}
      />

      {editing && (
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white border-0 hover:from-[var(--brand-from)] hover:opacity-90 hover:to-[var(--brand-to)] hover:opacity-90"
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

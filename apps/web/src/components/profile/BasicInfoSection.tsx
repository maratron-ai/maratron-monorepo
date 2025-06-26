import { TextField, SelectField, AvatarUpload, InfoTooltip } from "@components/ui";
import { User } from "@maratypes/user";
import styles from "./Section.module.css";
import type { Gender } from "@maratypes/user";
import Image from "next/image";
import DefaultAvatar from "@components/DefaultAvatar";

// runtime list of gender options
const genderValues: Gender[] = ["Male", "Female", "Other"];

// derive select options for Gender
const genderOptions = genderValues.map((g) => ({
  label: g,
  value: g,
}));

interface Props {
  formData: Partial<User>;
  isEditing: boolean;
  onChange: (field: keyof User, value: string) => void;
  /** show the VDOT field when editing */
  showVDOTField?: boolean;
}

export default function BasicInfoSection({
  formData,
  isEditing,
  onChange,
  showVDOTField = true,
}: Props) {
  const handleFieldChange = (name: string, value: string) =>
    onChange(name as keyof User, value);


  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Basic Information</h3>
      {isEditing ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center space-x-4 mb-4">
            <AvatarUpload
              value={formData.avatarUrl}
              onChange={(url) => onChange("avatarUrl", url)}
            />
          </div>
          <TextField
            label="Name"
            name="name"
            value={formData.name || ""}
            editing={isEditing}
            onChange={handleFieldChange}
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email || ""}
            editing={true}
            onChange={handleFieldChange}
            required
          />
          <TextField
            label="Age"
            name="age"
            type="number"
            value={formData.age ?? ""}
            editing={isEditing}
            onChange={handleFieldChange}
          />
          <SelectField
            label="Gender"
            name="gender"
            options={genderOptions}
            value={formData.gender || ""}
            editing={isEditing}
            onChange={handleFieldChange}
          />
          <SelectField
            label="Training Level"
            name="trainingLevel"
            options={[
              { label: "Beginner", value: "beginner" },
              { label: "Intermediate", value: "intermediate" },
              { label: "Advanced", value: "advanced" },
            ]}
            value={formData.trainingLevel || "beginner"}
            editing={isEditing}
            onChange={handleFieldChange}
          />
          {showVDOTField && (
            <TextField
              label={
                <span className="inline-flex items-center space-x-1">
                  <span>VDOT</span>
                  <InfoTooltip content="VDOT estimates your running fitness based on race times." />
                </span>
              }
              name="VDOT"
              type="number"
              value={formData.VDOT ?? ""}
              editing={isEditing}
              onChange={handleFieldChange}
            />
          )}
        </div>
      ) : (
        <dl className={`${styles.list} flex flex-col gap-4`}>
          <div className="md:col-span-2 flex items-center mb-4">
            {formData.avatarUrl ? (
              <Image
                src={formData.avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <DefaultAvatar
                size={80}
                className="border border-brand-to bg-brand-from"
              />
            )}
          </div>
          <div>
            <dt className={styles.label}>Name</dt>
            <dd className={styles.value}>{formData.name || "N/A"}</dd>
          </div>
          <div>
            <dt className={styles.label}>Email</dt>
            <dd className={styles.value}>{formData.email}</dd>
          </div>
          <div>
            <dt className={styles.label}>Age</dt>
            <dd className={styles.value}>{formData.age ?? "N/A"}</dd>
          </div>
          <div>
            <dt className={styles.label}>Gender</dt>
            <dd className={styles.value}>{formData.gender || "N/A"}</dd>
          </div>
          <div>
            <dt className={styles.label}>Training Level</dt>
            <dd className={`${styles.value} capitalize`}>
              {formData.trainingLevel || "N/A"}
            </dd>
          </div>
          <div>
            <dt className="inline-flex items-center space-x-1">
              VDOT
              <InfoTooltip className="text-center"
                content={
                  <>
                    VDOT estimates your running fitness based on race times.
                    <br />
                    This updates dynamically as you log runs.
                  </>
                }
              />
            </dt>
            <dd className={styles.value}>{formData.VDOT ?? "N/A"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

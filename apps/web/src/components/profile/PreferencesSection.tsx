import { SelectField } from "@components/ui";
import { User } from "@maratypes/user";
import { ChangeHandler } from "./GoalsSection";
import styles from "./Section.module.css";
// import type { DayOfWeek } from "@maratypes/user";

// Options for Device: label shown to user, value is Prisma enum key
const deviceOptions = [
  { label: "Garmin", value: "Garmin" },
  { label: "Polar", value: "Polar" },
  { label: "Suunto", value: "Suunto" },
  { label: "Fitbit", value: "Fitbit" },
  { label: "Apple Watch", value: "AppleWatch" },
  { label: "Samsung Galaxy Watch", value: "SamsungGalaxyWatch" },
  { label: "Coros", value: "Coros" },
  { label: "Other", value: "Other" },
];

interface Props {
  formData: Partial<User>;
  isEditing: boolean;
  onChange: ChangeHandler;
}

export default function PreferencesSection({
  formData,
  isEditing,
  onChange,
}: Props) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Preferences & Device</h3>
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <CheckboxGroupField
            label="Preferred Training Days"
            name="preferredTrainingDays"
            options={[
              { label: "Monday", value: "Monday" },
              { label: "Tuesday", value: "Tuesday" },
              { label: "Wednesday", value: "Wednesday" },
              { label: "Thursday", value: "Thursday" },
              { label: "Friday", value: "Friday" },
              { label: "Saturday", value: "Saturday" },
              { label: "Sunday", value: "Sunday" },
            ]}
            value={formData.preferredTrainingDays || []}
            editing={isEditing}
            onChange={(name, value) =>
              onChange(name as keyof User, value)
            }
          /> */}
          <SelectField
            label="Environment"
            name="preferredTrainingEnvironment"
            options={[
              { label: "Outdoor", value: "outdoor" },
              { label: "Treadmill", value: "treadmill" },
              { label: "Indoor", value: "indoor" },
              { label: "Mixed", value: "mixed" },
            ]}
            value={formData.preferredTrainingEnvironment || ""}
            editing={isEditing}
            onChange={(name, value) =>
              onChange(name as keyof User, value)
            }
          />
          <SelectField
            label="Device"
            name="device"
            options={deviceOptions}
            value={formData.device || ""}
            editing={isEditing}
            onChange={(name, value) =>
              onChange(name as keyof User, value)
            }
          />
        </div>
      ) : (
        <dl className={styles.list}>
          <div>
            <dt className={styles.label}>Preferred Training Days</dt>
            <dd className={styles.value}>
              {Array.isArray(formData.preferredTrainingDays)
                ? formData.preferredTrainingDays.join(", ")
                : "N/A"}
            </dd>
          </div>
          <div>
            <dt className={styles.label}>Environment</dt>
            <dd className={styles.value}>
              {formData.preferredTrainingEnvironment || "N/A"}
            </dd>
          </div>
          <div>
            <dt className={styles.label}>Device</dt>
            <dd className={styles.value}>{formData.device || "N/A"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

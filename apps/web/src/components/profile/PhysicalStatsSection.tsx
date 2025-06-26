import { TextField } from "@components/ui";
import { User } from "@maratypes/user";
import { ChangeHandler } from "./GoalsSection";
import styles from "./Section.module.css";

interface Props {
  formData: Partial<User>;
  isEditing: boolean;
  onChange: ChangeHandler;
}

export default function PhysicalStatsSection({
  formData,
  isEditing,
  onChange,
}: Props) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Physical Stats</h3>
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Height (inches)"
            name="height"
            type="number"
            value={formData.height ?? ""}
            editing={isEditing}
            onChange={(name, value) => onChange(name as keyof User, value)}
          />
          <TextField
            label="Weight (lbs)"
            name="weight"
            type="number"
            value={formData.weight ?? ""}
            editing={isEditing}
            onChange={(name, value) => onChange(name as keyof User, value)}
          />
          <TextField
            label="Years Running"
            name="yearsRunning"
            type="number"
            value={formData.yearsRunning ?? ""}
            editing={isEditing}
            onChange={(name, value) => onChange(name as keyof User, value)}
          />
          {/* Weekly mileage shouldn't be editable by user */}
          {/* <TextField
            label="Weekly Mileage"
            name="weeklyMileage"
            type="number"
            value={formData.weeklyMileage ?? ""}
            editing={isEditing}
            onChange={onChange}
          /> */}
        </div>
      ) : (
        <dl className={styles.list}>
          <div>
            <dt className={styles.label}>Height (inches)</dt>
            <dd className={styles.value}>{formData.height ?? "N/A"}</dd>
          </div>
          <div>
            <dt className={styles.label}>Weight (lbs)</dt>
            <dd className={styles.value}>{formData.weight ?? "N/A"}</dd>
          </div>
          <div>
            <dt className={styles.label}>Years Running</dt>
            <dd className={styles.value}>{formData.yearsRunning ?? "N/A"}</dd>
          </div>
          {/* <div>
            <dt className={styles.label}>Weekly Mileage</dt>
            <dd className={styles.value}>{formData.weeklyMileage ?? "N/A"}</dd>
          </div> */}
        </dl>
      )}
    </section>
  );
}

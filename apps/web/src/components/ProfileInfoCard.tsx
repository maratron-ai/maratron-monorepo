import Image from "next/image";
import { Card } from "@components/ui";
import DefaultAvatar from "@components/DefaultAvatar";
import type { User } from "@maratypes/user";

interface Props {
  profile: User;
}

export default function ProfileInfoCard({ profile }: Props) {
  return (
    <Card className="p-6 flex flex-col items-center text-center space-y-4">
      {profile.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={profile.name}
          width={96}
          height={96}
          className="w-24 h-24 rounded-full object-cover"
        />
      ) : (
        <DefaultAvatar size={96} className="w-24 h-24" />
      )}
      <h2 className="text-2xl font-bold">{profile.name}</h2>
      {profile.trainingLevel && (
        <p className="text-muted-foreground capitalize">
          {profile.trainingLevel}
        </p>
      )}
      {profile.weeklyMileage && (
        <p className="text-sm text-muted-foreground">
          Weekly Mileage: {profile.weeklyMileage}
          {" "}
          {profile.defaultDistanceUnit || "miles"}
        </p>
      )}
    </Card>
  );
}

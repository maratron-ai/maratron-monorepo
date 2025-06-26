"use client";
import Link from "next/link";
import { Card, Badge } from "@components/ui";
import type { RunGroup } from "@maratypes/social";

interface Props {
  group: RunGroup;
}

export default function GroupCard({ group }: Props) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          {group.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.imageUrl} alt={group.name} className="w-10 h-10 object-cover rounded-md" />
          )}
          <div>
            <Link href={`/social/groups/${group.id}`} className="font-semibold text-lg hover:underline">
              {group.name}
            </Link>
            {group.description && (
              <p className="text-sm text-foreground/70 break-words">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end text-sm text-foreground opacity-60 gap-1">
          <span>{group.memberCount ?? 0} members</span>
          <span>{group.postCount ?? 0} posts</span>
          {group.private && <Badge variant="secondary">Private</Badge>}
        </div>
      </div>
    </Card>
  );
}

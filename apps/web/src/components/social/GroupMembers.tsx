"use client";
import Image from "next/image";
import Link from "next/link";
import type { SocialProfile } from "@maratypes/social";
import DefaultAvatar from "@components/DefaultAvatar";
import {
  Card,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "@components/ui";

interface Props {
  members: SocialProfile[];
}

export default function GroupMembers({ members }: Props) {
  if (members.length === 0) return null;
  const visible = members.slice(0, 5);
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Members</h2>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {visible.map((m) => {
            const avatar = m.user?.avatarUrl || m.profilePhoto || m.avatarUrl;
            const isDefault = !avatar || avatar === "/default_profile.png" || avatar === "" || avatar?.includes("default_profile");
            return (
              <TooltipRoot key={m.id}>
                <TooltipTrigger asChild>
                  <Link href={`/u/${m.username}`} className="block">
                    <Card className="p-1 rounded-full">
                      {isDefault ? (
                        <DefaultAvatar size={32} />
                      ) : (
                        <Image
                          src={avatar}
                          alt={m.username}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>@{m.username}</TooltipContent>
              </TooltipRoot>
            );
          })}
          {members.length > 5 && <span className="text-xl">...</span>}
        </div>
      </TooltipProvider>
    </div>
  );
}

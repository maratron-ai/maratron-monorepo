"use client";
import Link from "next/link";
import { Card, CardContent, Badge } from "@components/ui";
import type { RunGroup } from "@maratypes/social";
import { Users, MessageSquare, Lock } from "lucide-react";

interface Props {
  group: RunGroup;
}

export default function GroupCard({ group }: Props) {
  return (
    <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {group.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={group.imageUrl} 
              alt={group.name} 
              className="w-12 h-12 object-cover rounded-lg ring-2 ring-zinc-200 dark:ring-zinc-700" 
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/social/groups/${group.id}`} 
                className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {group.name}
              </Link>
              {group.private && (
                <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            {group.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{group.memberCount ?? 0} members</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{group.postCount ?? 0} posts</span>
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}

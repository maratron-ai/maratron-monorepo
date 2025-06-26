"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { listShoes } from "@lib/api/shoe";
import { updateUser } from "@lib/api/user/user";
import { useUser } from "@hooks/useUser";
import type { Shoe } from "@maratypes/shoe";
import { Card, Button, Spinner } from "@components/ui";

export default function ShoesList() {
  const { data: session } = useSession();
  const { profile } = useUser();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultId, setDefaultId] = useState<string | undefined>();

  useEffect(() => {
    setDefaultId(profile?.defaultShoeId);
  }, [profile?.defaultShoeId]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    listShoes()
      .then((all) => {
        const userShoes = (all as Shoe[]).filter((s) => s.userId === userId);
        setShoes(userShoes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  // Sort so the default shoe is first, then by recency
  const sortedShoes = [...shoes].sort((a, b) => {
    if (a.id === defaultId) return -1;
    if (b.id === defaultId) return 1;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const setDefault = async (id: string) => {
    if (!session?.user?.id) return;
    try {
      await updateUser(session.user.id, { defaultShoeId: id });
      setDefaultId(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-4">
        <Spinner className="h-4 w-4" />
      </div>
    );
  if (shoes.length === 0)
    return <p className="text-foreground opacity-60">No shoes added.</p>;

  return (
    <div className="space-y-4">
      {sortedShoes.map((shoe) => {
        const isDefault = shoe.id === defaultId;
        return (
          <Card key={shoe.id} className="p-6 flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-semibold">{shoe.name}</p>
              <div className="text-sm space-y-1">
                <span>
                  {shoe.createdAt
                    ? new Date(shoe.createdAt).toLocaleDateString()
                    : ""}
                </span>
                <span className="ml-2">
                  {(Math.round(shoe.currentDistance * 10) / 10).toFixed(0)} / {(Math.round(shoe.maxDistance * 10) / 10).toFixed(0)} {shoe.distanceUnit}
                </span>
                {isDefault && (
                  <span className="ml-2 text-primary font-medium">default</span>
                )}
              </div>
            </div>
            {!isDefault && shoe.id && (
              <Button
                onClick={() => setDefault(shoe.id!)}
                className="text-sm px-2 py-1"
              >
                Make Default
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

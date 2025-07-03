"use client";
import { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import type { SocialProfile } from "@maratypes/social";
import { Input, Button, Card, Spinner } from "@components/ui";
import FollowUserButton from "@components/social/FollowUserButton";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";


interface Props {
  limit?: number;
}

export default function ProfileSearch({ limit = 5 }: Props) {
  const [visibleCount, setVisibleCount] = useState<number>(limit);
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SocialProfile[]>([]);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchMyProfile = async () => {
      if (session?.user?.id) {
        try {
          const { data } = await axios.get<SocialProfile>(
            `/api/social/profile/byUser/${session.user.id}`
          );
          setMyProfileId(data.id);
        } catch {
          setMyProfileId(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, [session?.user?.id]);

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { data } = await axios.get<SocialProfile[]>(
        `/api/social/search?q=${encodeURIComponent(query)}${myProfileId ? `&profileId=${myProfileId}` : ""}`
      );
      setResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await axios.get<SocialProfile[]>(
          `/api/social/search?q=${encodeURIComponent(query)}${myProfileId ? `&profileId=${myProfileId}` : ""}`
        );
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, myProfileId]);

  const showMore = () => {
    setVisibleCount(prev => prev + (5-limit)%5); // output should be a multiple of 5
  };


  if (!session?.user?.id) return <p>Please log in to search.</p>;
  if (loading)
    return (
      <div className="flex justify-center py-4">
        <Spinner className="h-4 w-4" />
      </div>
    );
  if (!myProfileId)
    return (
      <div className="space-y-2">
        <p>Create your social profile first.</p>
        <Button asChild>
          <a
            href="/social/profile/new"
            className="block mx-auto w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
          >
            Create Social Profile
          </a>
        </Button>
      </div>
    );

  return (
    <div>
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search runners"
          className="placeholder:text-foreground"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
        />
        <Button
          type="submit"
          className="w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
        >
          Search
        </Button>
      </form>
      <div className="space-y-4">
        {results.slice(0, visibleCount).map((p) => (
          <Card key={p.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={p.user?.avatarUrl || p.profilePhoto || "/default_profile.png"}
                alt={p.username}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border border-brand-to bg-brand-from"
              />
              <div>
                <a href={`/u/${p.username}`} className="font-semibold">
                  {p.name ?? p.username}
                </a>
                {p.bio && <p className="text-foreground opacity-70">{p.bio}</p>}
                <div className="text-sm text-foreground opacity-60">
                  <span>{p.runCount ?? 0} runs</span>{" "}
                  <span>{p.followerCount ?? 0} followers</span>
                </div>
              </div>
            </div>
            {myProfileId && myProfileId !== p.id && (
              <FollowUserButton profileId={p.id} />
            )}
          </Card>
        ))}
        {results.length > visibleCount && pathname != "/social/search" && (
          <div className="flex justify-center mt-4">
            <Link
              href="/social/search"
              passHref
              style={{ textDecoration: "none" }}
            >
              <Button
                size="sm"
                className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
              >
                See more
              </Button>
            </Link>
          </div>
        )}
        {results.length > visibleCount && (
          <div className="flex justify-center mt-4">
            <Button
              size="sm"
              className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from focus:ring-0"
              onClick={showMore}
            >
              See more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

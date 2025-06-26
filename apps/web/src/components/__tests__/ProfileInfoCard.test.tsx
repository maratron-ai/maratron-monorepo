import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileInfoCard from "../social/ProfileInfoCard";
import type { SocialProfile } from "@maratypes/social";
import type { User } from "@maratypes/user";

const profile: SocialProfile = {
  id: "p1",
  userId: "u1",
  username: "runner",
  bio: "fast",
  profilePhoto: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-02"),
  name: "Runner",
  runCount: 5,
  postCount: 2,
  totalDistance: 20,
  followerCount: 3,
  followingCount: 4,
};

const user: Pick<User, "avatarUrl" | "createdAt"> = {
  avatarUrl: "/avatar.png",
  createdAt: new Date("2024-01-01"),
};

describe("ProfileInfoCard", () => {
  it("shows profile details and edit button", () => {
    render(
      <ProfileInfoCard
        profile={profile}
        user={user}
        isSelf
        disableSelfStats
        followers={[]}
        following={[]}
        runs={[]}
      />
    );
    expect(screen.getByRole("heading", { name: /runner/i })).toBeInTheDocument();
    expect(screen.getByText(/5 runs/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit/i })).toBeInTheDocument();
  });
});

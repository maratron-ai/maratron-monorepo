import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FollowUserButton from "../social/FollowUserButton";
import { followUser, unfollowUser, isFollowing } from "@lib/api/social";
import { useSession } from "next-auth/react";
import { useSocialProfile } from "@hooks/useSocialProfile";

jest.mock("@lib/api/social");
jest.mock("next-auth/react", () => ({ useSession: jest.fn() }));
jest.mock("@hooks/useSocialProfile", () => ({ useSocialProfile: jest.fn() }));

const mockedFollow = followUser as jest.MockedFunction<typeof followUser>;
const mockedUnfollow = unfollowUser as jest.MockedFunction<typeof unfollowUser>;
const mockedIsFollowing = isFollowing as jest.MockedFunction<typeof isFollowing>;
const mockedSession = useSession as jest.Mock;
const mockedUseProfile = useSocialProfile as jest.Mock;

describe("FollowUserButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("follows another user", async () => {
    mockedSession.mockReturnValue({ data: { user: { id: "u1" } } });
    mockedUseProfile.mockReturnValue({ profile: { id: "p1" } });
    mockedIsFollowing.mockResolvedValue(false);
    mockedFollow.mockResolvedValue();
    const user = userEvent.setup();

    render(<FollowUserButton profileId="p2" />);

    const btn = await screen.findByRole("button", { name: /follow/i });
    await user.click(btn);

    expect(mockedFollow).toHaveBeenCalledWith("p1", "p2");
    expect(btn).toHaveTextContent(/unfollow/i);
  });

  it("unfollows a user", async () => {
    mockedSession.mockReturnValue({ data: { user: { id: "u1" } } });
    mockedUseProfile.mockReturnValue({ profile: { id: "p1" } });
    mockedIsFollowing.mockResolvedValue(true);
    mockedUnfollow.mockResolvedValue();
    const user = userEvent.setup();

    render(<FollowUserButton profileId="p2" />);

    const btn = await screen.findByRole("button", { name: /unfollow/i });
    await user.click(btn);

    expect(mockedUnfollow).toHaveBeenCalledWith("p1", "p2");
    expect(btn).toHaveTextContent(/follow/i);
  });
});

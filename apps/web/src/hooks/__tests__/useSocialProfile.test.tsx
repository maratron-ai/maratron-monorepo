import { renderHook, act } from "@testing-library/react";
import { useSocialProfile } from "@hooks/useSocialProfile";
import { useSession } from "next-auth/react";
import axios from "axios";
import type { SocialProfile } from "@maratypes/social";

jest.mock("next-auth/react", () => ({ useSession: jest.fn() }));
jest.mock("axios");

const mockedSession = useSession as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;

const profile: SocialProfile = { id: "p1", userId: "u1", username: "runner", createdAt: new Date(), updatedAt: new Date() } as SocialProfile;

describe("useSocialProfile", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns null when no session", () => {
    mockedSession.mockReturnValue({ data: null });
    const { result } = renderHook(() => useSocialProfile());
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("fetches profile", async () => {
    mockedSession.mockReturnValue({ data: { user: { id: "u1" } } });
    mockedAxios.get.mockResolvedValue({ data: profile });
    const { result } = renderHook(() => useSocialProfile());
    expect(result.current.loading).toBe(true);
    await act(async () => {});
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/social/profile/byUser/u1");
    expect(result.current.profile).toEqual(profile);
    expect(result.current.loading).toBe(false);
  });
});

import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SocialProfileEditForm from "@components/social/SocialProfileEditForm";
import { updateSocialProfile } from "@lib/api/social";
import type { SocialProfile } from "@maratypes/social";

jest.mock("@lib/api/social");

const mockedUpdate = updateSocialProfile as jest.MockedFunction<typeof updateSocialProfile>;

const profile: SocialProfile = {
  id: "p1",
  userId: "u1",
  username: "runner",
  bio: "hi",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("SocialProfileEditForm", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates profile", async () => {
    mockedUpdate.mockResolvedValue({ ...profile, username: "new", bio: "bye" });
    const onUpdated = jest.fn();
    const user = userEvent.setup();

    render(<SocialProfileEditForm profile={profile} onUpdated={onUpdated} />);

    await user.clear(screen.getByLabelText(/username/i));
    await user.type(screen.getByLabelText(/username/i), "new");
    await user.clear(screen.getByLabelText(/bio/i));
    await user.type(screen.getByLabelText(/bio/i), "bye");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockedUpdate).toHaveBeenCalledWith("p1", {
      username: "new",
      bio: "bye",
    });
    expect(onUpdated).toHaveBeenCalled();
    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument();
  });
});

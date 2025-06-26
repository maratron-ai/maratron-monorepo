/* eslint-disable @typescript-eslint/no-explicit-any */
import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SocialProfileForm from "../social/SocialProfileForm";
import { createSocialProfile } from "@lib/api/social";
import { useSession } from "next-auth/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@lib/api/social");
jest.mock("next-auth/react", () => ({ useSession: jest.fn() }));

const mockedCreate = createSocialProfile as jest.MockedFunction<typeof createSocialProfile>;
const mockedUseSession = useSession as jest.Mock;

describe("SocialProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits profile data", async () => {
    mockedUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
    mockedCreate.mockResolvedValue({ id: "p1" } as any);
    const onCreated = jest.fn();
    const user = userEvent.setup();

    render(<SocialProfileForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/username/i), "tester");
    await user.click(screen.getByRole("button", { name: /create profile/i }));

    expect(mockedCreate).toHaveBeenCalledWith({
      userId: "u1",
      username: "tester",
      bio: undefined,
    });
    expect(onCreated).toHaveBeenCalled();
    expect(await screen.findByText(/profile created!/i)).toBeInTheDocument();
  });

  it("shows error when session missing", async () => {
    mockedUseSession.mockReturnValue({ data: null });
    const user = userEvent.setup();

    render(<SocialProfileForm />);

    await user.type(screen.getByLabelText(/username/i), "tester");
    await user.click(screen.getByRole("button", { name: /create profile/i }));

    expect(mockedCreate).not.toHaveBeenCalled();
    expect(await screen.findByText(/username required/i)).toBeInTheDocument();
  });
});

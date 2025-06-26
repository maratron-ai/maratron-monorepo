/* eslint-disable @typescript-eslint/no-explicit-any */
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateSocialPost from "../social/CreateSocialPost";
import { createPost } from "@lib/api/social";
import { listRuns } from "@lib/api/run";
import { useSocialProfile } from "@hooks/useSocialProfile";

jest.mock("@lib/api/social");
jest.mock("@lib/api/run", () => ({ listRuns: jest.fn() }));
jest.mock("@hooks/useSocialProfile", () => ({ useSocialProfile: jest.fn() }));

const mockedCreate = createPost as jest.MockedFunction<typeof createPost>;
const mockedListRuns = listRuns as jest.MockedFunction<typeof listRuns>;
const mockedUseProfile = useSocialProfile as jest.Mock;

describe("CreateSocialPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits post data", async () => {
    mockedUseProfile.mockReturnValue({ profile: { id: "p1", userId: "u1" } });
    mockedCreate.mockResolvedValue({ id: "post1" } as any);
    mockedListRuns.mockResolvedValue([
      {
        id: "r1",
        userId: "u1",
        date: new Date().toISOString(),
        distance: 3,
        distanceUnit: "miles",
        duration: "00:20:00",
      } as any,
    ]);
    const onCreated = jest.fn();
    const user = userEvent.setup();

    render(<CreateSocialPost onCreated={onCreated} />);

    await waitFor(() => expect(mockedListRuns).toHaveBeenCalled());
    await user.selectOptions(await screen.findByLabelText(/run/i), "r1");
    await user.type(screen.getByLabelText(/caption/i), "Nice run");
    await user.click(screen.getByRole("button", { name: /post/i }));

    expect(mockedCreate).toHaveBeenCalledWith({
      socialProfileId: "p1",
      distance: 3,
      time: "00:20:00",
      caption: "Nice run",
      photoUrl: undefined,
    });
    expect(onCreated).toHaveBeenCalled();
    expect(await screen.findByText(/posted!/i)).toBeInTheDocument();
  });

  it("includes groupId when provided", async () => {
    mockedUseProfile.mockReturnValue({ profile: { id: "p1", userId: "u1" } });
    mockedCreate.mockResolvedValue({ id: "post1" } as any);
    mockedListRuns.mockResolvedValue([
      {
        id: "r1",
        userId: "u1",
        date: new Date().toISOString(),
        distance: 3,
        distanceUnit: "miles",
        duration: "00:20:00",
      } as any,
    ]);
    const user = userEvent.setup();

    render(<CreateSocialPost groupId="g1" />);

    await waitFor(() => expect(mockedListRuns).toHaveBeenCalled());
    await user.selectOptions(await screen.findByLabelText(/run/i), "r1");
    await user.click(screen.getByRole("button", { name: /post/i }));

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: "g1" })
    );
  });

  it("shows error when required fields missing", async () => {
    mockedUseProfile.mockReturnValue({ profile: { id: "p1", userId: "u1" } });
    mockedListRuns.mockResolvedValue([
      {
        id: "r1",
        userId: "u1",
        date: new Date().toISOString(),
        distance: 3,
        distanceUnit: "miles",
        duration: "00:20:00",
      } as any,
    ]);
    render(<CreateSocialPost />);

    const form = await screen
      .findByRole("button", { name: /post/i })
      .then((btn) => btn.closest("form")!);
    fireEvent.submit(form);

    expect(mockedCreate).not.toHaveBeenCalled();
    expect(await screen.findByText(/select a run/i)).toBeInTheDocument();
  });
});

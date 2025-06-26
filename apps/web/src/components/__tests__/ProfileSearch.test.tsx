import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileSearch from "../social/ProfileSearch";
import { useSession } from "next-auth/react";
import axios from "axios";

jest.mock("next-auth/react", () => ({ useSession: jest.fn() }));
jest.mock("axios");

const mockedSession = useSession as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ProfileSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires login", () => {
    mockedSession.mockReturnValue({ data: null });
    render(<ProfileSearch limit={5} />);
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it("searches profiles", async () => {
    mockedSession.mockReturnValue({ data: { user: { id: "u1" } } });
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/byUser/")) {
        return Promise.resolve({ data: { id: "p1" } });
      }
      if (url.includes("/search")) {
        return Promise.resolve({ data: [{ id: "p2", username: "runner" }] });
      }
      return Promise.resolve({ data: { following: false } });
    });
    const user = userEvent.setup();

    render(<ProfileSearch limit={5} />);

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledWith("/api/social/profile/byUser/u1"));
    await waitFor(() => screen.getByPlaceholderText(/search runners/i));

    await user.type(screen.getByPlaceholderText(/search runners/i), "run");

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/api/social/search?q=run&profileId=p1"
      )
    );
    expect(await screen.findByText(/runner/)).toBeInTheDocument();
  });

  it("orders followed profiles first", async () => {
    mockedSession.mockReturnValue({ data: { user: { id: "u1" } } });
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/byUser/")) {
        return Promise.resolve({ data: { id: "p1" } });
      }
      if (url.includes("/search")) {
        return Promise.resolve({
          data: [
            { id: "p2", username: "first" },
            { id: "p3", username: "second" },
          ],
        });
      }
      return Promise.resolve({ data: { following: false } });
    });
    const user = userEvent.setup();

    render(<ProfileSearch limit={5} />);

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/api/social/profile/byUser/u1"
      )
    );

    await user.type(screen.getByPlaceholderText(/search runners/i), "run");

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/api/social/search?q=run&profileId=p1"
      )
    );

    const links = await screen.findAllByRole("link", { name: /first|second/ });
    expect(links[0]).toHaveTextContent(/first/i);
    expect(links[1]).toHaveTextContent(/second/i);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "axios";
import {
  updateUser,
  createUser,
  getUser,
} from "../user/user";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("user api helpers", () => {
  afterEach(() => jest.clearAllMocks());

  it("updateUser puts data", async () => {
    mockedAxios.put.mockResolvedValue({ data: { id: "1" } });
    const result = await updateUser("1", { name: "joe" } as any);
    expect(mockedAxios.put).toHaveBeenCalledWith("/api/users/1", {
      name: "joe",
    });
    expect(result).toEqual({ id: "1" });
  });

  it("createUser posts data", async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: "1" } });
    const data = { name: "joe" };
    const result = await createUser(data as any);
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/users", data);
    expect(result).toEqual({ data: { id: "1" } });
  });

  it("getUser fetches data", async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: "1" } });
    const result = await getUser("1");
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/users/1");
    expect(result).toEqual({ id: "1" });
  });
});

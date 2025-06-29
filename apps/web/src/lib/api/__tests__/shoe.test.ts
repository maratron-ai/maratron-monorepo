/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "axios";
import {
  createShoe,
  updateShoe,
  getShoe,
  deleteShoe,
  listShoes,
} from "../shoe";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("shoe api helpers", () => {
  afterEach(() => jest.clearAllMocks());

  it("createShoe posts data", async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: "1" } });
    const data = { name: "shoe" };
    const result = await createShoe(data as any);
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/shoes", data);
    expect(result).toEqual({ id: "1" });
  });

  it("updateShoe puts data", async () => {
    mockedAxios.put.mockResolvedValue({ data: { id: "1" } });
    const result = await updateShoe("1", { name: "new" } as any);
    expect(mockedAxios.put).toHaveBeenCalledWith("/api/shoes/1", {
      name: "new",
    });
    expect(result).toEqual({ id: "1" });
  });

  it("getShoe fetches data", async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: "1" } });
    const result = await getShoe("1");
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/shoes/1");
    expect(result).toEqual({ id: "1" });
  });

  it("deleteShoe deletes data", async () => {
    mockedAxios.delete.mockResolvedValue({ data: {} });
    const result = await deleteShoe("1");
    expect(mockedAxios.delete).toHaveBeenCalledWith("/api/shoes/1");
    expect(result).toEqual({});
  });

  it("listShoes gets all shoes", async () => {
    mockedAxios.get.mockResolvedValue({ data: [1, 2] });
    const result = await listShoes();
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/shoes");
    expect(result).toEqual([1, 2]);
  });
});

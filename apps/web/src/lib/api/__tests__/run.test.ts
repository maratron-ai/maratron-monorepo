// src/lib/api/__tests__/run.test.ts

import axios from "axios";
import { createRun, updateRun, getRun, deleteRun, listRuns } from "../run";
import type { Run } from "@maratypes/run";
import type { DistanceUnit, ElevationUnit, TrainingEnvironment } from "@maratypes/basics";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

interface RawRunDto {
  id?: string;
  date: string;                  // ISO string
  duration: string;
  distance: number;
  distanceUnit: DistanceUnit;
  trainingEnvironment?: TrainingEnvironment;
  name?: string;
  pace?: string;                 // e.g. "07:30"
  paceUnit?: DistanceUnit;      
  elevationGain?: number;
  elevationGainUnit?: ElevationUnit;
  notes?: string;
  userId: string;
  shoeId?: string;
}

const apiRun: RawRunDto = {
  id: "1",
  date: "2024-01-01T00:00:00.000Z",
  duration: "00:30:00",
  distance: 5,
  distanceUnit: "miles",
  pace: "06:00",
  paceUnit: "miles",
  userId: "user1",
};

const mappedRun: Run = {
  id: "1",
  date: new Date(apiRun.date),
  duration: "00:30:00",
  distance: 5,
  distanceUnit: "miles",
  pace: { pace: "06:00", unit: "miles" },
  userId: "user1",
};

describe("run api helpers", () => {
  afterEach(() => jest.clearAllMocks());

  it("createRun posts data and maps result", async () => {
    mockedAxios.post.mockResolvedValue({ data: apiRun });
    const data = { distance: 5 };
    const result = await createRun(data);
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/runs", data);
    expect(result).toEqual(mappedRun);
  });

  it("updateRun puts data and maps result", async () => {
    mockedAxios.put.mockResolvedValue({ data: apiRun });
    const result = await updateRun("1", { distance: 10 });
    expect(mockedAxios.put).toHaveBeenCalledWith("/api/runs/1", {
      distance: 10,
    });
    expect(result).toEqual(mappedRun);
  });

  it("getRun fetches data and maps result", async () => {
    mockedAxios.get.mockResolvedValue({ data: apiRun });
    const result = await getRun("1");
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/runs/1");
    expect(result).toEqual(mappedRun);
  });

  it("deleteRun deletes data", async () => {
    mockedAxios.delete.mockResolvedValue({ data: {} });
    const result = await deleteRun("1");
    expect(mockedAxios.delete).toHaveBeenCalledWith("/api/runs/1");
    expect(result).toBeUndefined(); // deleteRun returns void
  });

  it("listRuns gets all runs and maps them", async () => {
    mockedAxios.get.mockResolvedValue({ 
      data: { 
        runs: [apiRun],
        pagination: {
          page: 0,
          limit: 50,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      }
    });
    const result = await listRuns("user1");
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/runs?userId=user1");
    expect(result).toEqual([mappedRun]);
  });
});

// src/lib/api/run/index.ts
import axios from "axios";
import { 
  Run, 
} from "@maratypes/run";
import {
  DistanceUnit,
  ElevationUnit,
  TrainingEnvironment,
} from "@maratypes/basics";

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

const mapRun = (dto: RawRunDto): Run => ({
  id: dto.id,
  date: new Date(dto.date),
  duration: dto.duration,
  distance: dto.distance,
  distanceUnit: dto.distanceUnit,
  trainingEnvironment: dto.trainingEnvironment,
  name: dto.name,
  pace:
    dto.pace && dto.paceUnit
      ? { pace: dto.pace, unit: dto.paceUnit }
      : undefined,
  elevationGain: dto.elevationGain,
  elevationGainUnit: dto.elevationGainUnit,
  notes: dto.notes,
  userId: dto.userId,
  shoeId: dto.shoeId,
});


export const createRun = async (
  data: Partial<RawRunDto>
): Promise<Run> => {
  const { data: dto } = await axios.post<RawRunDto>("/api/runs", data);
  return mapRun(dto);
};

export const updateRun = async (
  runId: string,
  data: Partial<RawRunDto>
): Promise<Run> => {
  const { data: dto } = await axios.put<RawRunDto>(
    `/api/runs/${runId}`,
    data
  );
  return mapRun(dto);
};

export const getRun = async (runId: string): Promise<Run> => {
  const { data: dto } = await axios.get<RawRunDto>(
    `/api/runs/${runId}`
  );
  return mapRun(dto);
};

export const deleteRun = async (runId: string): Promise<void> => {
  await axios.delete(`/api/runs/${runId}`);
};

export const listRuns = async (userId: string): Promise<Run[]> => {
  const { data } = await axios.get<RawRunDto[]>(`/api/runs?userId=${userId}`);
  return data.map(mapRun);
};

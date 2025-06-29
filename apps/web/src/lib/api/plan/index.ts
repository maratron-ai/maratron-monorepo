import axios from "axios";
import { RunningPlan } from "@maratypes/runningPlan";

export const createRunningPlan = async (data: Partial<RunningPlan>) => {
  const response = await axios.post(`/api/running-plans`, data);
  return response.data;
};

export const updateRunningPlan = async (id: string, data: Partial<RunningPlan>) => {
  const response = await axios.put(`/api/running-plans/${id}`, data);
  return response.data;
};

export const getRunningPlan = async (id: string) => {
  const response = await axios.get(`/api/running-plans/${id}`);
  return response.data;
};

export const deleteRunningPlan = async (id: string) => {
  const response = await axios.delete(`/api/running-plans/${id}`);
  return response.data;
};

export const listRunningPlans = async () => {
  const response = await axios.get(`/api/running-plans`);
  return response.data;
};

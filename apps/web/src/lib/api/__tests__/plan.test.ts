/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { createRunningPlan, updateRunningPlan, getRunningPlan, deleteRunningPlan, listRunningPlans } from '../plan';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('plan api helpers', () => {
  afterEach(() => jest.clearAllMocks());

  it('createRunningPlan posts data', async () => {
    mockedAxios.post.mockResolvedValue({ data: { id: '1' } });
    const data = { userId: 'u1', planData: { weeks: 1, schedule: [] } };
    const result = await createRunningPlan(data as any);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/running-plans', data);
    expect(result).toEqual({ id: '1' });
  });

  it('updateRunningPlan puts data', async () => {
    mockedAxios.put.mockResolvedValue({ data: { id: '1' } });
    const result = await updateRunningPlan('1', { planData: { weeks: 2, schedule: [] } } as any);
    expect(mockedAxios.put).toHaveBeenCalledWith('/api/running-plans/1', { planData: { weeks: 2, schedule: [] } });
    expect(result).toEqual({ id: '1' });
  });

  it('getRunningPlan fetches data', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: '1' } });
    const result = await getRunningPlan('1');
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/running-plans/1');
    expect(result).toEqual({ id: '1' });
  });

  it('deleteRunningPlan deletes data', async () => {
    mockedAxios.delete.mockResolvedValue({ data: {} });
    const result = await deleteRunningPlan('1');
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/running-plans/1');
    expect(result).toEqual({});
  });

  it('listRunningPlans gets all plans', async () => {
    mockedAxios.get.mockResolvedValue({ data: [1, 2] });
    const result = await listRunningPlans();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/running-plans');
    expect(result).toEqual([1, 2]);
  });
});

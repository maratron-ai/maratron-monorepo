import axios from "axios";
import { Shoe } from "@maratypes/shoe";

// Create a new shoe
export const createShoe = async (data: Partial<Shoe>) => {
  const response = await axios.post(`/api/shoes`, data);
  return response.data;
};

// Update an existing shoe
export const updateShoe = async (shoeId: string, data: Partial<Shoe>) => {
  const response = await axios.put(`/api/shoes/${shoeId}`, data);
  return response.data;
};

// Get a specific shoe by ID
export const getShoe = async (shoeId: string) => {
  const response = await axios.get(`/api/shoes/${shoeId}`);
  return response.data;
};

// Delete a shoe by ID
export const deleteShoe = async (shoeId: string) => {
  const response = await axios.delete(`/api/shoes/${shoeId}`);
  return response.data;
};

// List all shoes (optionally extend this with filters as needed)
export const listShoes = async () => {
  const response = await axios.get(`/api/shoes`);
  return response.data;
};

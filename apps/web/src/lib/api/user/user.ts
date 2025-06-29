//src/lib/api/user/user.ts

import axios from "axios";
import { User } from "@maratypes/user";

export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url as string;
};


// updates
export const updateUser = async (
  userId: string,
  data: Partial<User>
) => {
  // put req
  const response = await axios.put(`/api/users/${userId}`, data);
  return response.data;
};


// creates new
export const createUser = async (data: Partial<User>) => {
  // post req
  const response = await axios.post(`/api/users`, data);
  return response;
};

// fetch by id
export const getUser = async (userId: string): Promise<User> => {
  const response = await axios.get(`/api/users/${userId}`);
  return response.data;
};

import axios from "axios";
import {SavedStoryItem, Story } from "../types";
import { Ipaddress } from "@/constants/ip";

const API_URL = `${Ipaddress}/api`;

export const getStories = async (): Promise<Story[]> => {
  const res = await axios.get(`${API_URL}/stories`);
  return res.data;
};

export const createStory = async (payload: any) => {
  const res = await axios.post(`${API_URL}/stories`, payload);
  return res.data;
};

export const getStoryById = async (id: string): Promise<Story> => {
  const res = await axios.get(`${API_URL}/stories/id/${id}`);
  return {
    ...res.data,
    tags: res.data.tags || [],
    chapters: res.data.chapters || [],
  };
};

export const addSaveStory = async (
  userId: string,
  storyId: string
) => {
  const res = await axios.post(`${API_URL}/savestories`, {
    userId,
    storyId,
  });
  return res.data;
};

export const checkSaveStory = async (
  userId: string,
  storyId: string
): Promise<{ saved: boolean }> => {
  const res = await axios.get(`${API_URL}/savestories/check`, {
    params: { userId, storyId },
  });
  return res.data;
};

export const getSaveStory = async (
  userId: string
): Promise<SavedStoryItem[]> => {
  const res = await axios.get<SavedStoryItem[]>(
    `${API_URL}/savestories/user/${userId}`
  );
  return res.data;
};


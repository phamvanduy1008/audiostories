import { api } from "./api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get("/categories");
  return res.data;
};

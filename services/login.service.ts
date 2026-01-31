import axios, { AxiosError } from "axios";
import { Ipaddress } from "@/constants/ip";

interface AuthResponse {
  id: string;
  username: string;
  email: string;
  token: string;
}

interface AuthErrorResponse {
  message?: string;
  error?: string;
}

const api = axios.create({
  baseURL: Ipaddress,
  headers: {
    "Content-Type": "application/json",
  },
});

const setAuthData = (data: AuthResponse) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: data.id,
      username: data.username,
      email: data.email,
    })
  );
};

export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/api/users/login", {
      email,
      password,
    });

    setAuthData(response.data);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<AuthErrorResponse>;
    if (err.response) {
      throw new Error(
        err.response.data.message ||
          err.response.data.error ||
          `Đăng nhập thất bại (${err.response.status})`
      );
    } else if (err.request) {
      throw new Error("Không kết nối được đến server. Vui lòng kiểm tra mạng.");
    } else {
      throw new Error("Có lỗi xảy ra khi đăng nhập.");
    }
  }
};

export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/api/users/register", {
      username,
      email,
      password,
    });

    setAuthData(response.data);

    return response.data;
  } catch (error) {
    const err = error as AxiosError<AuthErrorResponse>;
    if (err.response) {
      throw new Error(
        err.response.data.message ||
          err.response.data.error ||
          `Đăng ký thất bại (${err.response.status})`
      );
    } else if (err.request) {
      throw new Error("Không kết nối được đến server. Vui lòng kiểm tra mạng.");
    } else {
      throw new Error("Có lỗi xảy ra khi đăng ký.");
    }
  }
};
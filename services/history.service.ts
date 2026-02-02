import axios from 'axios';
import { Ipaddress } from "@/constants/ip";

const API_URL = `${Ipaddress}/api`;

// Chỉ giữ hàm lưu history (dùng cho ENDED)
export const saveHistory = async (payload: {
  userId: string;
  storyId: string;
  chapterId: string;
  lastPosition: number;
  duration?: number;
  progressPercent: number;
  isCompleted: boolean;
}): Promise<any> => {
  try {
    const res = await axios.post(`${API_URL}/history`, payload);
    return res.data;
  } catch (err: any) {
    console.error('Lỗi lưu lịch sử nghe:', err);
    const errorMessage = err.response?.data?.message || 'Không thể lưu lịch sử nghe.';
    throw new Error(errorMessage);
  }
};

// Giữ lại nếu có màn History list
export const getUserHistory = async (userId: string): Promise<any[]> => {
  try {
    const res = await axios.get(`${API_URL}/history/user/${userId}`);
    return res.data;
  } catch (err: any) {
    console.error('Lỗi lấy lịch sử nghe:', err);
    throw new Error(err.response?.data?.message || 'Không thể tải lịch sử nghe.');
  }
};


import axios from 'axios';
import { Ipaddress } from "@/constants/ip";

const API_URL = `${Ipaddress}/api`;

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
    console.log('[saveHistory] Gửi payload:', payload);

    const res = await axios.post(`${API_URL}/history`, payload);

    console.log('[saveHistory] Response thành công:', res.data);
    return res.data;
  } catch (err: any) {
    console.error('[saveHistory] Lỗi đầy đủ:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    const errorMessage = err.response?.data?.message || 'Không thể lưu lịch sử nghe.';
    throw new Error(errorMessage);
  }
};

export const getUserHistory = async (userId: string): Promise<any[]> => {
  try {
    console.log('[getUserHistory] Gọi API với userId:', userId);

    const res = await axios.get(`${API_URL}/history/user/${userId}`);

    console.log('[getUserHistory] Dữ liệu nhận được:', res.data);
    return res.data;
  } catch (err: any) {
    console.error('[getUserHistory] Lỗi:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    throw new Error(err.response?.data?.message || 'Không thể tải lịch sử nghe.');
  }
};
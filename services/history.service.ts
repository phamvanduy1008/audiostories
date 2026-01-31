import axios from 'axios';
import { Ipaddress } from "@/constants/ip";
import { HistoryItem } from '@/types';

const API_URL = `${Ipaddress}/api`;

// Lấy danh sách lịch sử nghe của user
export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  try {
    const res = await axios.get(`${API_URL}/history/user/${userId}`);
    return res.data;
  } catch (err: any) {
    console.error('Lỗi lấy lịch sử nghe:', err);
    const errorMessage = err.response?.data?.message || 'Không thể tải lịch sử nghe. Vui lòng thử lại.';
    throw new Error(errorMessage);
  }
};

// Kiểm tra lịch sử cho một story cụ thể
export const checkHistory = async (userId: string, storyId: string): Promise<{ exists: boolean; history: HistoryItem | null }> => {
  try {
    const res = await axios.get(`${API_URL}/history/check`, {
      params: { userId, storyId }
    });
    return res.data;
  } catch (err: any) {
    console.error('Lỗi kiểm tra lịch sử:', err);
    const errorMessage = err.response?.data?.message || 'Không thể kiểm tra lịch sử.';
    throw new Error(errorMessage);
  }
};

// Lưu hoặc cập nhật lịch sử nghe (dùng trong Player)
export const saveHistory = async (payload: {
  userId: string;
  storyId: string;
  chapterId?: string;
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

// Xóa một bản ghi lịch sử (dựa trên userId và storyId)
export const deleteHistoryEntry = async (userId: string, storyId: string): Promise<any> => {
  try {
    const res = await axios.delete(`${API_URL}/history`, {
      data: { userId, storyId }
    });
    return res.data;
  } catch (err: any) {
    console.error('Lỗi xóa lịch sử:', err);
    const errorMessage = err.response?.data?.message || 'Không thể xóa lịch sử.';
    throw new Error(errorMessage);
  }
};

// Optional: Xóa toàn bộ lịch sử của user (nếu cần thêm endpoint backend sau này)
export const clearUserHistory = async (userId: string): Promise<any> => {
  try {
    // Giả sử backend có endpoint DELETE /history/user/:userId
    const res = await axios.delete(`${API_URL}/history/user/${userId}`);
    return res.data;
  } catch (err: any) {
    console.error('Lỗi xóa toàn bộ lịch sử:', err);
    const errorMessage = err.response?.data?.message || 'Không thể xóa toàn bộ lịch sử.';
    throw new Error(errorMessage);
  }
};
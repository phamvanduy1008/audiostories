
import { GoogleGenAI } from "@google/genai";
import { Story } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getStoryInsight(story: Story): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tại sao người nghe sẽ thích câu chuyện âm thanh này?
      Tiêu đề: "${story.title}"
      Tác giả: ${story.author}
      Mô tả: ${story.description}
      Hãy viết một đoạn giới thiệu ngắn gọn, thuyết phục trong 2 câu bằng tiếng Việt để gợi ý cho người dùng.`,
    });
    return response.text || "Câu chuyện này mang lại một trải nghiệm đắm chìm độc đáo sẽ thu hút trí tưởng tượng của bạn.";
  } catch (error) {
    console.error("Lỗi Gemini:", error);
    return "Một trải nghiệm lắng nghe chân thực hoàn hảo phù hợp với tâm trạng hiện tại của bạn.";
  }
}

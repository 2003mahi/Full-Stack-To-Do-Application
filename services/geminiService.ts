
import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  /**
   * Generates sub-tasks (with suggested priorities) and metadata for a given task title.
   */
  async suggestTaskBreakdown(title: string): Promise<{
    description: string;
    subTasks: { text: string; priority: Priority }[];
    priority: Priority;
    category: string;
  }> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the task: "${title}". Suggest a brief description, a few logical sub-steps with individual priority levels, an appropriate overall priority level, and a single word category.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            subTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "One of: low, medium, high" }
                },
                required: ["text", "priority"]
              }
            },
            priority: {
              type: Type.STRING,
              description: "One of: low, medium, high"
            },
            category: { type: Type.STRING }
          },
          required: ["description", "subTasks", "priority", "category"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return parsed;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return {
        description: "",
        subTasks: [],
        priority: Priority.MEDIUM,
        category: "General"
      };
    }
  },

  /**
   * Suggests a priority level for a single sub-task text.
   */
  async suggestSubTaskPriority(text: string): Promise<Priority> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this specific sub-task: "${text}". Suggest a priority level: low, medium, or high.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING, description: "One of: low, medium, high" }
          },
          required: ["priority"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return (parsed.priority as Priority) || Priority.MEDIUM;
    } catch (e) {
      return Priority.MEDIUM;
    }
  }
};

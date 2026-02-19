import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AttendanceRecord, Student } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to pause execution
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to retry operations with exponential backoff on 429 errors
async function callWithRetry<T>(operation: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      
      // Check for various error structures returned by Gemini SDK / API
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.error?.code === 429 ||
        error?.error?.status === 'RESOURCE_EXHAUSTED' ||
        (error?.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED'))) ||
        (error?.error?.message && (error.error.message.includes('429') || error.error.message.includes('quota') || error.error.message.includes('RESOURCE_EXHAUSTED')));

      if (isRateLimit && attempt <= retries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`Gemini API Rate Limit (429). Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`);
        await wait(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export const generateAttendanceReport = async (
  attendance: AttendanceRecord[],
  allStudents: Student[]
): Promise<string> => {
  if (!apiKey) {
    return "API Key not configured. Unable to generate smart report.";
  }

  const presentStudentIds = new Set(attendance.map(a => a.studentId));
  const absentStudents = allStudents.filter(s => !presentStudentIds.has(s.id));
  const presentStudents = allStudents.filter(s => presentStudentIds.has(s.id));

  const summaryData = {
    date: new Date().toLocaleDateString(),
    totalStudents: allStudents.length,
    presentCount: presentStudents.length,
    absentCount: absentStudents.length,
    presentNames: presentStudents.map(s => s.name),
    absentNames: absentStudents.map(s => s.name),
    attendanceRate: `${((presentStudents.length / allStudents.length) * 100).toFixed(1)}%`
  };

  const prompt = `
    You are a helpful school administrator assistant. 
    Analyze the following daily attendance data and generate a professional, concise summary report in Markdown format.
    
    Data:
    ${JSON.stringify(summaryData, null, 2)}
    
    The report should include:
    1. A headline with the date.
    2. A brief statistical summary (Attendance Rate).
    3. A list of absent students (if any) with a polite reminder suggestion for the teacher to follow up.
    4. An encouraging closing remark.
    
    Use formatting like bolding and bullet points to make it readable.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    }));

    return response.text || "No report generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (
        error?.message?.includes('429') || 
        error?.message?.includes('quota') || 
        error?.error?.message?.includes('quota') ||
        error?.error?.code === 429
    ) {
        return "Unable to generate report: API Quota Exceeded. Please try again later.";
    }
    return "Failed to generate report due to an error.";
  }
};
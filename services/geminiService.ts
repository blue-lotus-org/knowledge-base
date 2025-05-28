
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';

let ai: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable is not set for Gemini API.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const generateSummary = async (text: string): Promise<string> => {
  try {
    const client = getAIClient();
    const prompt = `Summarize the following text concisely for a knowledge base entry. Focus on the key information and make it easy to understand quickly:\n\n---\n${text}\n---\n\nSummary:`;
    
    const response: GenerateContentResponse = await client.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });

    const summaryText = response.text;
    if (!summaryText) {
      throw new Error("Received an empty summary from the API.");
    }
    return summaryText.trim();
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating summary.");
  }
};

export const answerQuestionBasedOnContext = async (context: string, question: string): Promise<string> => {
  try {
    const client = getAIClient();
    const prompt = `Based on the following context, answer the question. If the context doesn't provide enough information, say so.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;
    
    const response: GenerateContentResponse = await client.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });

    const answerText = response.text;
    if (!answerText) {
      throw new Error("Received an empty answer from the API.");
    }
    return answerText.trim();
  } catch (error) {
    console.error("Error answering question with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while answering question.");
  }
};
    
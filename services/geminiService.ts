
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudentLevel, Word, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helper: Decode base64 to Uint8Array
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Audio Helper: Convert PCM to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const geminiService = {
  async fetchWordsByLevel(level: StudentLevel, count: number = 10): Promise<Word[]> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} essential English vocabulary words for ${level} students. Include phonetic symbols, Chinese translation, a concise English definition, and one high-quality example sentence with its Chinese translation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              definition: { type: Type.STRING },
              translation: { type: Type.STRING },
              exampleSentence: { type: Type.STRING },
              exampleTranslation: { type: Type.STRING },
            },
            required: ["word", "phonetic", "definition", "translation", "exampleSentence", "exampleTranslation"]
          }
        }
      }
    });

    try {
      const words = JSON.parse(response.text || "[]");
      return words.map((w: any, index: number) => ({
        ...w,
        id: `${level}-${Date.now()}-${index}`,
        level,
        learned: false
      }));
    } catch (e) {
      console.error("Failed to parse words", e);
      return [];
    }
  },

  async generateQuiz(words: Word[]): Promise<QuizQuestion[]> {
    const wordsList = words.map(w => w.word).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a vocabulary quiz for these words: ${wordsList}. For each word, create one multiple-choice question. The question can be about the meaning or a sentence completion. Provide 4 options for each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              wordId: { type: Type.STRING, description: "The actual word this question is testing" },
              type: { type: Type.STRING, enum: ["meaning", "completion"] }
            },
            required: ["question", "options", "correctAnswer", "wordId", "type"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  },

  async playPronunciation(text: string): Promise<void> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Pronounce: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error("TTS Error:", error);
    }
  }
};


import { Type, Modality } from "@google/genai";
import { StudentLevel, Word, QuizQuestion, TargetLanguage } from "../types";

// 重要：請務必將此處改為你 Render 部署後的實際網址
const RENDER_RELAY_URL = 'https://startulip.onrender.com';

function decodeBase64(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decoding failed", e);
    return new Uint8Array();
  }
}

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

async function callRelay(payload: any) {
  try {
    const response = await fetch(`${RENDER_RELAY_URL}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`中繼站錯誤 (${response.status}): ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error("Fetch Relay Error:", err);
    throw err;
  }
}

export const geminiService = {
  async fetchWordsByLevel(level: StudentLevel, targetLanguage: TargetLanguage, count: number = 10): Promise<Word[]> {
    const payload = {
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} essential English vocabulary words for ${level} students. All explanations and translations MUST be in ${targetLanguage}. Include phonetic symbols, ${targetLanguage} translation, a concise English definition, and one high-quality example sentence with its ${targetLanguage} translation.`,
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
    };

    try {
      const data = await callRelay(payload);
      // 根據你的後端回傳結構調整，通常是 data.text 或 data.candidates[0].content.parts[0].text
      const text = data.text || (data.candidates && data.candidates[0]?.content?.parts[0]?.text);
      
      if (!text) throw new Error("後端未回傳有效的文字內容");
      
      const words = typeof text === 'string' ? JSON.parse(text) : text;
      return words.map((w: any, index: number) => ({
        ...w,
        id: `${level}-${Date.now()}-${index}`,
        level,
        learned: false
      }));
    } catch (e) {
      console.error("fetchWordsByLevel 失敗:", e);
      return [];
    }
  },

  async generateQuiz(words: Word[]): Promise<QuizQuestion[]> {
    const wordsList = words.map(w => w.word).join(', ');
    const payload = {
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
              wordId: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    };

    try {
      const data = await callRelay(payload);
      const text = data.text || (data.candidates && data.candidates[0]?.content?.parts[0]?.text);
      return typeof text === 'string' ? JSON.parse(text) : text;
    } catch (e) {
      console.error("Quiz generation error", e);
      return [];
    }
  },

  async playPronunciation(text: string, languageName: string = "English"): Promise<void> {
    const payload = {
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Pronounce this in ${languageName}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    };

    try {
      const data = await callRelay(payload);
      const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || data.audioData;
      
      if (!base64Audio) {
        console.warn("未收到語音數據");
        return;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error("TTS Relay Error:", error);
    }
  }
};

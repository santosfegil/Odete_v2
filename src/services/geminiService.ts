import { GoogleGenAI, Type, FunctionDeclaration, Tool, Part } from "@google/genai";
import { DatabaseTool } from "../types";
import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
// Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || ''; 
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// --- Tool Definitions (Structure ready for DB connection) ---

// 1. Check Balance Tool
const checkBalanceTool: FunctionDeclaration = {
  name: 'checkBalance',
  description: 'Verifica o saldo atual da conta bancária do usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      accountType: {
        type: Type.STRING,
        description: 'O tipo de conta (corrente ou poupança). Padrão é corrente.',
      }
    },
  },
};

// 2. Check Expenses Tool
const checkExpensesTool: FunctionDeclaration = {
  name: 'checkExpenses',
  description: 'Verifica gastos recentes em uma categoria específica ou no geral.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'Categoria do gasto (ex: iFood, Uber, Mercado). Se vazio, busca geral.',
      },
      period: {
        type: Type.STRING,
        description: 'Período de tempo (ex: "hoje", "este mês", "últimos 7 dias").',
      }
    },
    required: ['period'],
  },
};

const toolsDef: Tool[] = [{
  functionDeclarations: [checkBalanceTool, checkExpensesTool]
}];

// --- Mock Database Implementation ---
const dbTools: Record<string, DatabaseTool> = {
  checkBalance: {
    name: 'checkBalance',
    execute: async ({ accountType }) => {
      console.log(`[DB Mock] Checking balance for ${accountType || 'corrente'}`);
      return JSON.stringify({ balance: 1420.50, currency: 'BRL', status: 'ok' });
    }
  },
  checkExpenses: {
    name: 'checkExpenses',
    execute: async ({ category, period }) => {
      console.log(`[DB Mock] Checking expenses: ${category || 'all'} for ${period}`);
      if (category?.toLowerCase().includes('ifood')) {
        return JSON.stringify({ total: 450.20, count: 8, currency: 'BRL', msg: "Alto gasto detectado." });
      }
      return JSON.stringify({ total: 1250.00, items: 15, currency: 'BRL' });
    }
  }
};

export class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;
  private supabase: any; // Typed as any to avoid import errors if package missing

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
    
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  // Text Chat with Function Calling
  // UPDATED: Can now optionally route through Supabase Edge Function
  async sendMessage(
    message: string,
    history: any[],
    systemInstruction: string,
    onToolCall?: (toolName: string) => void,
    audioData?: { data: string, mimeType: string },
    mode?: 'mimar' | 'julgar'
  ): Promise<string> {
    
    // --- OPTION A: PROXY BACKEND (Try Supabase first) ---
    // Note: We currently only proxy simple text messages without tools/audio for this demo version
    if (this.supabase && !audioData && !onToolCall) { 
        try {
            console.log("Attempting to use Supabase Proxy...");
            const { data, error } = await this.supabase.functions.invoke('odete-chat', {
                body: { message, history, mode }
            });
            
            if (error) throw error;
            if (data && data.text) return data.text;
            
        } catch (e) {
            console.warn("Backend proxy failed/skipped, falling back to client-side:", e);
            // Fallthrough to Option B
        }
    }

    // --- OPTION B: CLIENT SIDE (Fallback & Full Features) ---
    try {
      const modelId = 'gemini-2.5-flash'; 
      
      const chat = this.ai.chats.create({
        model: modelId,
        history: history,
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: toolsDef, 
        }
      });

      let msgContent: string | Part[] = message;

      if (audioData) {
        msgContent = [
          { text: message },
          {
            inlineData: {
              mimeType: audioData.mimeType,
              data: audioData.data
            }
          }
        ];
      }

      let response = await chat.sendMessage({ message: msgContent });
      
      // Handle Function Calls loop (Client Side logic)
      let text = response.text;
      
      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.functionCall) {
            const fc = part.functionCall;
            if (onToolCall) onToolCall(fc.name);
            
            const toolImpl = dbTools[fc.name];
            let functionResult = {};
            
            if (toolImpl) {
               const jsonResult = await toolImpl.execute(fc.args);
               functionResult = { result: JSON.parse(jsonResult) };
            } else {
               functionResult = { error: "Function not found" };
            }

            const responseParts: Part[] = [{
                functionResponse: {
                  name: fc.name,
                  response: functionResult 
                }
            }];

            response = await chat.sendMessage({
              message: responseParts
            });
            text = response.text;
          }
        }
      }

      return text || "Desculpe, não entendi.";
    } catch (error) {
      console.error("Gemini Text Error:", error);
      return "Ocorreu um erro ao processar sua mensagem. (Erro de conexão ou formato)";
    }
  }
  
  // Image Analysis
  async analyzeImage(base64Image: string, prompt: string, systemInstruction: string): Promise<string> {
    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    }
                ]
            },
            config: {
                systemInstruction
            }
        });
        return response.text || "";
    } catch (e) {
        console.error(e);
        return "Erro ao analisar imagem.";
    }
  }

  getAIInstance() {
    return this.ai;
  }
  
  getToolsDef() {
      return toolsDef;
  }
  
  getDbTools() {
      return dbTools;
  }
}
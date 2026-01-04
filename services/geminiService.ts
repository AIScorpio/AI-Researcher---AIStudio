import { GoogleGenAI, Type } from "@google/genai";
import { Paper, BankingDomain, AIDomain, Methodology, ChatMessage, LLMSettings } from '../types';
import { storageService } from './storageService';

const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Rate Limiting Helpers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 2, initialDelay = 20000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        const msg = error.message || '';
        // Check for Rate Limit (429) or Service Overload (503)
        const isTransient = msg.includes('429') || error.status === 429 || error.code === 429 || msg.includes('503');
        
        if (retries > 0 && isTransient) {
            console.warn(`API Rate Limit Hit. Pausing for ${initialDelay/1000}s before retry...`);
            await delay(initialDelay);
            // Exponential backoff
            return retryOperation(operation, retries - 1, initialDelay * 2);
        }
        // If retries exhausted or error is not transient, throw it.
        throw error;
    }
}

// --- Groq Integration ---
async function callGroqAPI(messages: any[], settings: LLMSettings): Promise<string> {
    if (!settings.groqApiKey) return "Error: Groq API Key is missing in Settings.";
    
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${settings.groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: settings.groqModel || 'llama3-70b-8192'
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Groq API Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (e: any) {
        console.error("Groq Call Failed:", e);
        return `Provider Error: ${e.message}`;
    }
}

export const optimizeSearchQuery = async (topic: string, dateRange: string): Promise<string> => {
  const settings = storageService.getSettings();
  const prompt = `Refine into boolean search query for Google Scholar. Topic: "${topic}", Date: "${dateRange}". Return ONLY query.`;

  // 1. Groq Path
  if (settings.provider === 'groq') {
      return await callGroqAPI([{role: 'user', content: prompt}], settings);
  }

  // 2. Gemini Path (Default)
  if (!ai) return topic; 
  try {
    // We do NOT retry here to save quota for the main collection task
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || topic;
  } catch (error: any) {
    console.warn("Optimization skipped to conserve quota or due to error.");
    return topic;
  }
};

/**
 * Validates and Sanitizes raw paper data.
 */
function sanitizePapers(papers: any[]): Paper[] {
    const now = new Date();
    now.setHours(now.getHours() + 24);

    return papers.map(p => {
        let safeAuthors: string[] = ['Unknown Author'];
        if (Array.isArray(p.authors)) {
            safeAuthors = p.authors.map((a: any) => String(a).trim()).filter((a: string) => a.length > 0);
        } else if (typeof p.authors === 'string') {
            safeAuthors = p.authors.includes(',') 
                ? p.authors.split(',').map((s: string) => s.trim()) 
                : [p.authors.trim()];
        }
        if (safeAuthors.length === 0) safeAuthors = ['Unknown Author'];

        const validBanking = Object.values(BankingDomain).includes(p.bankingDomain as BankingDomain) 
            ? p.bankingDomain 
            : BankingDomain.GENERAL_BANKING;
        
        const validAI = Object.values(AIDomain).includes(p.aiDomain as AIDomain) 
            ? p.aiDomain 
            : AIDomain.PREDICTIVE_ANALYTICS;
            
        const validMethod = Object.values(Methodology).includes(p.methodology as Methodology) 
            ? p.methodology 
            : Methodology.THEORETICAL;

        return {
            id: generateId(),
            title: p.title || "Untitled Research",
            abstract: p.abstract || "No abstract available.",
            authors: safeAuthors,
            publicationDate: p.publicationDate || new Date().toISOString().split('T')[0],
            source: p.source || "Web",
            url: p.url && p.url.startsWith('http') ? p.url : `https://scholar.google.com/scholar?q=${encodeURIComponent(p.title || '')}`,
            citationCount: typeof p.citationCount === 'number' ? p.citationCount : 0,
            bankingDomain: validBanking,
            aiDomain: validAI,
            methodology: validMethod,
            tags: Array.isArray(p.tags) ? p.tags : [],
            isFavorite: false,
            collectedAt: new Date().toISOString()
        } as Paper;

    }).filter(p => {
        if (p.title.length < 5 || p.title === "Untitled Research") return false;
        const pubDate = new Date(p.publicationDate);
        if (!isNaN(pubDate.getTime()) && pubDate > now) {
            return false;
        }
        return true;
    });
}

/**
 * Fallback to Knowledge Base (One-Pass)
 * ONLY used if Google Search tool fails but API is still accessible.
 */
async function collectPapersFromKnowledgeBase(query: string, afterDate?: string): Promise<Paper[]> {
    if (!ai) return [];
    console.log("Attempting Knowledge Base Retrieval (Fallback)...");
    
    try {
        const response = await retryOperation(async () => {
             if (!ai) throw new Error("No AI");
             return await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `
                You are a Banking AI Research Assistant.
                The user wants research papers on: "${query}".
                
                Task: List at least 5-8 REAL, EXISTING research papers from your training data.
                
                Constraints:
                1. Published roughly after ${afterDate || '2023-01-01'}.
                2. Must relate to Banking/Finance.
                3. CLASSIFY THEM IMMEDIATELY based on the options below.
                
                Options for 'bankingDomain': ${Object.values(BankingDomain).join(', ')}
                Options for 'aiDomain': ${Object.values(AIDomain).join(', ')}
                Options for 'methodology': ${Object.values(Methodology).join(', ')}
                
                Return JSON Array with: title, abstract, authors (array), publicationDate (YYYY-MM-DD), url, source, bankingDomain, aiDomain, methodology.
                `,
                 config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                abstract: { type: Type.STRING },
                                authors: { type: Type.ARRAY, items: { type: Type.STRING } },
                                publicationDate: { type: Type.STRING },
                                url: { type: Type.STRING },
                                source: { type: Type.STRING },
                                bankingDomain: { type: Type.STRING },
                                aiDomain: { type: Type.STRING },
                                methodology: { type: Type.STRING },
                            },
                            required: ['title', 'abstract', 'authors', 'bankingDomain']
                        }
                    }
                }
            });
        }, 1, 5000); 

        const text = response.text;
        if (!text) return [];
        const rawData = JSON.parse(text.trim());
        return sanitizePapers(rawData);

    } catch (e) {
        console.warn("Knowledge Base fallback failed.", e);
        // Throw if it's a quota error, otherwise return empty
        if ((e as any).message?.includes('429')) throw e;
        return [];
    }
}

/**
 * Primary Collection - ONE PASS SEARCH & CLASSIFY
 */
export const collectPapersFromWeb = async (query: string, sources: string[] = [], afterDate?: string): Promise<Paper[]> {
  if (!ai) {
    throw new Error("API Key not configured.");
  }

  const sourceStr = sources.length > 0 ? `Sources: ${sources.join(', ')}` : "Sources: Reputable Technical Journals/ArXiv";
  const dateStr = afterDate ? `Published strictly AFTER: ${afterDate}` : "Recent publications";

  try {
    const response = await retryOperation(async () => {
        if (!ai) throw new Error("No AI");
        return await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: `
            Perform an exhaustive Google Search to find ACTUAL research papers: "${query}".
            
            CONSTRAINTS:
            1. ${sourceStr}
            2. ${dateStr}
            3. Focus on Banking/Financial Services.
            
            CRITICAL:
            - Find 5-10 high quality papers.
            - CLASSIFY THEM IMMEDIATELY based on these options (Pick the best fit):
              - bankingDomain: ${Object.values(BankingDomain).join(', ')}
              - aiDomain: ${Object.values(AIDomain).join(', ')}
              - methodology: ${Object.values(Methodology).join(', ')}
            
            Return VALID JSON ARRAY inside markdown code block.
            Fields: title, abstract, authors (array), publicationDate (YYYY-MM-DD), url, source, bankingDomain, aiDomain, methodology.
            `,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
    }, 2, 20000); // 2 Retries, 20s delay. This is aggressive but necessary for 429s.

    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");
    
    let rawData: any[] = [];
    try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text.replace(/```/g, ''); 
        rawData = JSON.parse(jsonStr);
    } catch (e) {
        console.warn("JSON Parsing failed from Search result.");
        // If search returned text but not JSON, we might have hit a different issue.
        // We do NOT want to fake data. We try KB fallback if it's a parsing issue, NOT a quota issue.
        return await collectPapersFromKnowledgeBase(query, afterDate);
    }

    if (!Array.isArray(rawData)) return [];
    
    return sanitizePapers(rawData);

  } catch (error: any) {
    const msg = error.message || '';
    const isQuota = msg.includes('429') || error.code === 429;
    
    if (isQuota) {
        // CRITICAL: We explicitly THROW here. 
        // We do NOT return mock data.
        // The UI must handle this error.
        console.error("Gemini Quota Exceeded. Stopping collection.");
        throw new Error("Quota Exceeded (429): The research agent has hit the daily/minute limit. Please try again later.");
    }
    
    console.error("Collection error:", msg);
    
    // For other errors (search failed, parsing failed), we can try KB if we want, 
    // but if the user wants strictness, maybe we just throw? 
    // I will try KB once, but if that fails, we return empty or throw.
    try {
        return await collectPapersFromKnowledgeBase(query, afterDate);
    } catch (kbError) {
        throw error; // Throw the original error if KB fails too
    }
  }
}

// Deprecated
export const categorizePaper = async (paper: Partial<Paper>): Promise<Paper> => {
    return sanitizePapers([paper])[0]; 
}

/**
 * High Volume Daily Batch Job
 */
export const runDailyBatchJob = async (): Promise<number> => {
    const lastRunTimestamp = storageService.getLastBatchRun();
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    if (now - lastRunTimestamp < ONE_DAY_MS && lastRunTimestamp !== 0) return 0;

    // Longer delay to ensure we don't block user interaction immediately on load
    await delay(20000);

    console.log("Starting Optimized Daily Batch Job...");
    
    let afterDate = '2023-01-01';
    if (lastRunTimestamp > 0) {
        const d = new Date(lastRunTimestamp);
        afterDate = d.toISOString().split('T')[0];
    } else {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        afterDate = d.toISOString().split('T')[0];
    }

    // Only 1 domain per run to minimize quota usage
    const domains = Object.values(BankingDomain)
        .sort(() => 0.5 - Math.random())
        .slice(0, 1); 
    
    const sources = storageService.getSources();
    let totalNewCount = 0;

    try {
        for (const domain of domains) {
            const query = `Latest technical research in ${domain} using Generative AI and LLMs`;
            // We catch errors here specifically so the background job doesn't crash the app,
            // but we stop processing if we hit a limit.
            try {
                const fullPapers = await collectPapersFromWeb(query, sources, afterDate);
                for (const p of fullPapers) {
                    const saved = storageService.savePaper(p);
                    if (saved) totalNewCount++;
                }
                if (fullPapers.length > 0) break; 
            } catch (e: any) {
                if (e.message.includes('Quota') || e.message.includes('429')) {
                    console.warn("Batch job stopped due to quota.");
                    break; 
                }
            }
        }

        storageService.setLastBatchRun(now);
        console.log(`Daily Batch Job Completed. Added ${totalNewCount} papers.`);
        return totalNewCount;

    } catch (e) {
        console.error("Daily Batch Job Failed:", e);
        return totalNewCount;
    }
};

export const queryRepository = async (
    history: ChatMessage[],
    userMessage: string, 
    papers: Paper[]
): Promise<string> => {
    const settings = storageService.getSettings();
    const knowledgeBase = papers.slice(0, 50).map((p, index) => 
        `[Paper ${index+1}] ${p.title} (${p.publicationDate}) - ${p.abstract.substring(0, 150)}...`
    ).join('\n');

    const systemInstruction = `You are a Banking AI Research Assistant. Answer based on the Repository Context below. Cite [Paper N].\n\nRepository Context:\n${knowledgeBase}`;

    // 1. Groq Path
    if (settings.provider === 'groq') {
        const messages = [
            { role: 'system', content: systemInstruction },
            ...history.map(h => ({ role: h.role, content: h.text })),
            { role: 'user', content: userMessage }
        ];
        return await callGroqAPI(messages, settings);
    }

    // 2. Gemini Path
    if (!ai) return "Service unavailable (Missing API Key).";
    try {
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction },
            history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
        });

        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "No response generated.";
    } catch (e: any) {
         if (e.message?.includes('429')) return "System is currently overloaded (Quota Limit). Please try again in a few minutes.";
        return "Error analyzing repository.";
    }
};
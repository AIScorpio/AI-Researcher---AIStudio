import { Paper, User, LLMSettings } from '../types';

const PAPERS_KEY = 'bankai_papers';
const USER_KEY = 'bankai_user';
const LAST_BATCH_KEY = 'bankai_last_batch_run';
const SOURCES_KEY = 'bankai_sources';
const SETTINGS_KEY = 'bankai_llm_settings';

const DEFAULT_SOURCES = ['ArXiv', 'Google Scholar', 'IEEE Xplore', 'SSRN', 'ACM Digital Library'];

const DEFAULT_SETTINGS: LLMSettings = {
    provider: 'gemini',
    groqModel: 'llama3-70b-8192'
};

export const storageService = {
  getPapers: (): Paper[] => {
    const stored = localStorage.getItem(PAPERS_KEY);
    if (!stored) {
      return [];
    }
    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        
        // Read-time sanitization to fix legacy data structure issues (like authors string vs array)
        return parsed.map((p: any) => ({
            ...p,
            authors: Array.isArray(p.authors) ? p.authors : (typeof p.authors === 'string' ? [p.authors] : ['Unknown']),
            tags: Array.isArray(p.tags) ? p.tags : [],
            title: p.title || "Untitled",
            abstract: p.abstract || "No abstract"
        }));
    } catch (e) {
        console.error("Error parsing stored papers", e);
        return [];
    }
  },

  savePaper: (paper: Paper): boolean => {
    const papers = storageService.getPapers();
    // Prevent duplicates by title OR url
    const isDuplicate = papers.some(p => 
        p.title.toLowerCase() === paper.title.toLowerCase() || 
        (p.url && paper.url && p.url === paper.url)
    );

    if (isDuplicate) {
        return false; // Did not save
    }
    const updated = [paper, ...papers];
    localStorage.setItem(PAPERS_KEY, JSON.stringify(updated));
    return true; // Saved successfully
  },

  toggleFavorite: (id: string) => {
    const papers = storageService.getPapers();
    const updated = papers.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    localStorage.setItem(PAPERS_KEY, JSON.stringify(updated));
    return updated;
  },

  addTag: (id: string, tag: string) => {
    const papers = storageService.getPapers();
    const updated = papers.map(p => {
      if (p.id === id && !p.tags.includes(tag)) {
        return { ...p, tags: [...p.tags, tag] };
      }
      return p;
    });
    localStorage.setItem(PAPERS_KEY, JSON.stringify(updated));
    return updated;
  },

  getUser: (): User | null => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  login: (email: string) => {
    const user: User = { email, name: email.split('@')[0] };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  // Batch Job Methods
  getLastBatchRun: (): number => {
    const stored = localStorage.getItem(LAST_BATCH_KEY);
    return stored ? parseInt(stored, 10) : 0;
  },

  setLastBatchRun: (timestamp: number) => {
    localStorage.setItem(LAST_BATCH_KEY, timestamp.toString());
  },

  // Source Management
  getSources: (): string[] => {
    const stored = localStorage.getItem(SOURCES_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SOURCES;
  },

  addSource: (source: string) => {
    const sources = storageService.getSources();
    if (!sources.includes(source)) {
        const updated = [...sources, source];
        localStorage.setItem(SOURCES_KEY, JSON.stringify(updated));
        return updated;
    }
    return sources;
  },

  removeSource: (source: string) => {
    const sources = storageService.getSources();
    const updated = sources.filter(s => s !== source);
    localStorage.setItem(SOURCES_KEY, JSON.stringify(updated));
    return updated;
  },

  // LLM Settings
  getSettings: (): LLMSettings => {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: LLMSettings) => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
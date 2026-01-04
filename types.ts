
export enum BankingDomain {
  PORTFOLIO_OPTIMIZATION = 'Portfolio Optimization',
  RISK_CONTROL = 'Investment Risk Control',
  FRAUD_DETECTION = 'Fraud Detection',
  AML_COMPLIANCE = 'AML Compliance & Control',
  CUSTOMER_SERVICING = 'Customer Servicing (eKYC/CDD)',
  GENERAL_BANKING = 'General Banking AI'
}

export enum AIDomain {
  LLM_SFT = 'LLM SFT',
  RLHF = 'RLHF',
  AGENT_DESIGN = 'Agent Designing',
  AGENTIC_PIPELINE = 'Agentic AI Pipeline',
  RAG = 'RAG Systems',
  PREDICTIVE_ANALYTICS = 'Predictive Analytics'
}

export enum Methodology {
  EMPIRICAL = 'Empirical Study',
  THEORETICAL = 'Theoretical Framework',
  CASE_STUDY = 'Case Study',
  SURVEY = 'Survey/Review',
  PROTOTYPE = 'Prototype/Implementation'
}

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  publicationDate: string;
  source: string;
  url: string;
  citationCount: number;
  bankingDomain: BankingDomain;
  aiDomain: AIDomain;
  methodology: Methodology;
  tags: string[];
  isFavorite: boolean;
  collectedAt: string;
}

export interface User {
  email: string;
  name: string;
}

export interface SearchCriteria {
  topic: string;
  sources: string;
  dateRange: string;
  useLLMOptimization: boolean;
}

export type CollectionStatus = 'idle' | 'optimizing' | 'searching' | 'analyzing' | 'saving' | 'completed' | 'error';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type LLMProvider = 'gemini' | 'groq';

export interface LLMSettings {
    provider: LLMProvider;
    groqApiKey?: string;
    groqModel?: string; // e.g. llama3-70b-8192
}

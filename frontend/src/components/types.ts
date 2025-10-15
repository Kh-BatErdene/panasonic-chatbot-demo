export interface MarketSummary {
  title?: string;
  historicalTrend?: string;
  forecastOutlook?: string;
  keyFindings?: string[];
  insights?: string[];
  recommendations?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  marketSummary?: MarketSummary;
}

export interface ChatQuestionRequest {
  message: string;
  conversation_history: ChatMessage[];
}

export interface ChatQuestionResponse {
  message_id: string;
  status: string;
  message: string;
}

export interface ChatAnswerRequest {
  message_id: string;
}

export interface ChatAnswerResponse {
  message_id: string;
  answer: string;
  status: string;
  timestamp: string;
}

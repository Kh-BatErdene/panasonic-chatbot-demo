import {
  ChatAnswerRequest,
  ChatAnswerResponse,
  ChatMessage,
  ChatQuestionRequest,
  ChatQuestionResponse,
} from "@/components/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class ChatService {
  static async submitQuestion(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatQuestionResponse> {
    const request: ChatQuestionRequest = {
      message,
      conversation_history: conversationHistory,
    };

    const response = await fetch(`${API_BASE_URL}/chat/question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit question: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAnswer(messageId: string): Promise<ChatAnswerResponse> {
    const request: ChatAnswerRequest = {
      message_id: messageId,
    };

    const response = await fetch(`${API_BASE_URL}/chat/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to get answer: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAnswerStream(
    messageId: string,
    onChunk: (chunk: unknown) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    const request: ChatAnswerRequest = {
      message_id: messageId,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/chat/answer/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get streaming answer: ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
            } catch (e) {
              console.warn("Failed to parse chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }

  static async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async getProductCategories(): Promise<{ categories: string[] }> {
    const response = await fetch(`${API_BASE_URL}/chat/data/categories`);

    if (!response.ok) {
      throw new Error(
        `Failed to get product categories: ${response.statusText}`
      );
    }

    return response.json();
  }

  static async getSubcategories(
    category?: string
  ): Promise<{ subcategories: string[] }> {
    const url = category
      ? `${API_BASE_URL}/chat/data/subcategories?category=${encodeURIComponent(
          category
        )}`
      : `${API_BASE_URL}/chat/data/subcategories`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get subcategories: ${response.statusText}`);
    }

    return response.json();
  }

  static async getRegions(): Promise<{ regions: string[] }> {
    const response = await fetch(`${API_BASE_URL}/chat/data/regions`);

    if (!response.ok) {
      throw new Error(`Failed to get regions: ${response.statusText}`);
    }

    return response.json();
  }

  static async performWebSearch(input: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/chat/web-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error(`Failed to perform web search: ${response.statusText}`);
    }

    return response.json();
  }
}

export type { ChatMessage };

"use client";

import { useState, useCallback } from "react";
import {
  MessageDisplay,
  MessageInput,
  ReportDisplay,
} from "@/components/chatbot";
import { ChatService, ChatMessage } from "@/lib/api";
import { extractMarketSummary } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMarketSummary, setCurrentMarketSummary] = useState<
    string | null
  >(null);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const questionResponse = await ChatService.submitQuestion(
          message,
          messages
        );

        const answerResponse = await ChatService.getAnswer(
          questionResponse.message_id
        );

        // Extract market summary from the response
        console.log('Processing assistant response:', answerResponse.answer.substring(0, 200) + '...');
        const marketSummary = extractMarketSummary(answerResponse.answer);
        console.log('Extracted market summary:', marketSummary);

        const assistantMessage: ChatMessage = {
          id: answerResponse.message_id,
          role: "assistant",
          content: answerResponse.answer,
          timestamp: new Date(answerResponse.timestamp),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update current market summary if found
        if (marketSummary) {
          console.log('Setting market summary:', marketSummary.substring(0, 100) + '...');
          setCurrentMarketSummary(marketSummary);
        } else {
          console.log('No market summary found in response');
        }
      } catch (error) {
        console.error("Error sending message:", error);

        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  return (
    <div className="w-full h-[calc(100%-48px)]">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={18} minSize={15} maxSize={40}>
          <div className="h-full border-r">
            <ReportDisplay summary={currentMarketSummary || undefined} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col max-w-4xl m-auto">
            <div className="h-[calc(100%-124px)] overflow-hidden">
              <MessageDisplay messages={messages} isLoading={isLoading} />
            </div>
            <div className="h-31">
              <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

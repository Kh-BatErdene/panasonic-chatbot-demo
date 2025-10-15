"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MessageDisplay,
  MessageInput,
  ReportDisplay,
} from "@/components/chatbot";
import { ChatService, ChatMessage } from "@/lib/api";
import { extractMarketSummary } from "@/lib/utils";
import { useClientI18n } from "@/hooks/useClientI18n";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function Home() {
  const { t } = useClientI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMarketSummary, setCurrentMarketSummary] = useState<
    string | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );

  // Send initial message on component mount
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: ChatMessage = {
        id: "initial-" + Date.now().toString(),
        role: "assistant",
        content: "Please select a product category.",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [messages.length]);

  const handleInteractiveSelection = useCallback(
    async (messageId: string, selection: string) => {
      console.log(
        "Page - Interactive selection received:",
        selection,
        "selectedCategory:",
        selectedCategory,
        "selectedSubcategory:",
        selectedSubcategory
      );

      // Add user selection as a message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: selection,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Determine the conversation flow based on current state
        let assistantResponse = "";

        if (!selectedCategory) {
          // User selected a category
          console.log("Page - Setting selected category to:", selection);
          setSelectedCategory(selection);
          assistantResponse = "Please select a subcategory.";
        } else if (!selectedSubcategory) {
          // User selected a subcategory - show analysis immediately
          console.log("Page - Setting selected subcategory to:", selection);
          setSelectedSubcategory(selection);

          // Send to AI for analysis with Global region by default
          const questionResponse = await ChatService.submitQuestion(
            `Analyze the market for ${selectedCategory} - ${selection} in Global region`,
            messages
          );

          const answerResponse = await ChatService.getAnswer(
            questionResponse.message_id
          );

          assistantResponse = answerResponse.answer;

          // Extract market summary if available
          const marketSummary = extractMarketSummary(answerResponse.answer);
          if (marketSummary) {
            setCurrentMarketSummary(marketSummary);
          }

          // Add a follow-up message for region selection
          setTimeout(() => {
            const regionMessage: ChatMessage = {
              id: Date.now().toString() + "-region",
              role: "assistant",
              content:
                "You can also select specific regions to customize the analysis further.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, regionMessage]);
          }, 1000);
        } else {
          // User selected regions - send to AI for analysis with specific regions
          const questionResponse = await ChatService.submitQuestion(
            `Analyze the market for ${selectedCategory} - ${selectedSubcategory} in regions: ${selection}`,
            messages
          );

          const answerResponse = await ChatService.getAnswer(
            questionResponse.message_id
          );

          assistantResponse = answerResponse.answer;

          // Extract market summary if available
          const marketSummary = extractMarketSummary(answerResponse.answer);
          if (marketSummary) {
            setCurrentMarketSummary(marketSummary);
          }
        }

        const assistantMessage: ChatMessage = {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: assistantResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error processing selection:", error);

        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: t("chat.errorProcessing"),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, selectedCategory, selectedSubcategory]
  );

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
        console.log(
          "Processing assistant response:",
          answerResponse.answer.substring(0, 200) + "..."
        );
        const marketSummary = extractMarketSummary(answerResponse.answer);
        console.log("Extracted market summary:", marketSummary);

        const assistantMessage: ChatMessage = {
          id: answerResponse.message_id,
          role: "assistant",
          content: answerResponse.answer,
          timestamp: new Date(answerResponse.timestamp),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update current market summary if found
        if (marketSummary) {
          console.log(
            "Setting market summary:",
            marketSummary.substring(0, 100) + "..."
          );
          setCurrentMarketSummary(marketSummary);
        } else {
          console.log("No market summary found in response");
        }
      } catch (error) {
        console.error("Error sending message:", error);

        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: t("chat.error"),
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
              <MessageDisplay
                messages={messages}
                isLoading={isLoading}
                onInteractiveSelection={handleInteractiveSelection}
                selectedCategory={selectedCategory}
              />
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

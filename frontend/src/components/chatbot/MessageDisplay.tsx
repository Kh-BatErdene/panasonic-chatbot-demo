"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
// import { ChartDisplay } from "./ChartDisplay";
import { InteractiveMessage } from "./InteractiveMessage";
import { useClientI18n } from "@/hooks/useClientI18n";

// ChartSeries interface removed as unused

// ChartConfig interface removed as unused

// Function to validate chart configuration (removed as unused)

// Function to extract chartConfig from message content (removed as unused)

// Function to remove chartConfig and Market Trend Summary from content for display
function removeChartConfigAndSummaryFromContent(content: string) {
  try {
    let cleanedContent = content.replace(
      /```(?:json)?\s*\{[\s\S]*?(?:"chartConfig")[\s\S]*?\}\s*```/g,
      ""
    );

    cleanedContent = cleanedContent.replace(
      /\{\s*"(?:chartConfig)"\s*:\s*\{[\s\S]*?\}\s*\}/g,
      ""
    );

    // Remove Market Trend Summary section
    cleanedContent = cleanedContent.replace(
      /\*\*Market Trend Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/gi,
      ""
    );

    // Remove any standalone Summary section
    cleanedContent = cleanedContent.replace(
      /\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/gi,
      ""
    );

    return cleanedContent.trim();
  } catch (error) {
    console.error("Error removing chartConfig and summary:", error);
    return content;
  }
}

export function MessageDisplay({
  messages,
  isLoading = false,
  onInteractiveSelection,
  selectedCategory,
}: {
  messages: ChatMessage[];
  isLoading?: boolean;
  onInteractiveSelection?: (messageId: string, selection: string) => void;
  selectedCategory?: string;
}) {
  const { t } = useClientI18n();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => {
          const isStreaming =
            isLoading && message.role === "assistant" && message.content === "";
          const displayContent =
            message.role === "assistant"
              ? removeChartConfigAndSummaryFromContent(message.content)
              : message.content;

          return (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="space-y-4">
                    <MarkdownRenderer
                      content={displayContent}
                      className="text-sm -mb-2"
                    />
                    {isStreaming && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                        <span>AI is thinking...</span>
                      </div>
                    )}
                    {(() => {
                      const content = displayContent.toLowerCase();
                      const initialMessage = t(
                        "page.initialMessage"
                      ).toLowerCase();
                      const selectSubcategory = t(
                        "page.selectSubcategory"
                      ).toLowerCase();
                      const selectRegion = t("page.selectRegion").toLowerCase();

                      return (
                        content.includes(initialMessage) ||
                        content.includes(selectSubcategory) ||
                        content.includes(selectRegion) ||
                        content.includes("product category") ||
                        content.includes("subcategory") ||
                        content.includes("please select a product category") ||
                        content.includes("please select a subcategory") ||
                        content.includes("please select a region") ||
                        content.includes("製品カテゴリ") ||
                        content.includes("サブカテゴリ") ||
                        content.includes("地域") ||
                        (content.includes("select") &&
                          content.includes("region"))
                      );
                    })() && (
                      <InteractiveMessage
                        messageId={message.id}
                        messageContent={displayContent}
                        onSelection={(selection) =>
                          onInteractiveSelection?.(message.id, selection)
                        }
                        isLoading={isLoading}
                        selectedCategory={selectedCategory}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 rounded-lg px-3 py-2 border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="size-1 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="size-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="size-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {t("page.analyzing")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

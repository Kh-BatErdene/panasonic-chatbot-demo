"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ChartDisplay } from "./ChartDisplay";
import { InteractiveMessage } from "./InteractiveMessage";
import { useClientI18n } from "@/hooks/useClientI18n";

interface ChartSeries {
  name: string;
  type: string;
  stack: string;
  data: number[];
  itemStyle: {
    color: string;
  };
}

interface ChartConfig {
  title: {
    text: string;
    subtext?: string;
    left?: string;
  };
  tooltip: {
    trigger: string;
    axisPointer: {
      type: string;
    };
  };
  legend: {
    data: string[];
    bottom?: string;
  };
  grid: {
    left: string;
    right: string;
    bottom: string;
    top?: string;
    containLabel: boolean;
  };
  xAxis: {
    type: string;
    data: string[];
  };
  yAxis: {
    type: string;
    name: string;
    axisLabel: {
      formatter: string;
    };
  };
  series: ChartSeries[];
}

// Function to extract chartConfig from message content
function extractChartConfig(content: string): ChartConfig | null {
  try {
    // First, try to find JSON within markdown code blocks
    const codeBlockMatch = content.match(
      /```(?:json)?\s*(\{[\s\S]*?"chartConfig"[\s\S]*?\})\s*```/
    );
    if (codeBlockMatch) {
      let jsonString = codeBlockMatch[1];

      // Clean up common JSON issues
      jsonString = jsonString
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* comments */
        .replace(/\/\/.*$/gm, "") // Remove // comments
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/[^\x20-\x7E\s]/g, ""); // Remove non-printable characters

      try {
        const parsed = JSON.parse(jsonString);
        const chartConfig = parsed.chartConfig;

        // Check if chart config has valid data
        if (chartConfig && chartConfig.series) {
          const hasValidData = chartConfig.series.every(
            (series: ChartSeries) => {
              return (
                series.data &&
                Array.isArray(series.data) &&
                series.data.length > 0 &&
                !series.data.some(
                  (value: number | string) =>
                    typeof value === "string" &&
                    (value.includes("[values]") || value.includes("values"))
                )
              );
            }
          );

          if (!hasValidData) {
            console.warn(
              "Chart config contains placeholder data, skipping chart display"
            );
            return null;
          }
        }

        return chartConfig;
      } catch (parseError) {
        console.warn("Failed to parse JSON from code block:", parseError);
      }
    }

    // Fallback: Look for chartConfig in the content with more specific regex
    const chartConfigMatch = content.match(
      /\{\s*"chartConfig"\s*:\s*\{[\s\S]*?\}\s*\}/
    );
    if (chartConfigMatch) {
      let jsonString = chartConfigMatch[0];

      // Clean up common JSON issues
      jsonString = jsonString
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .replace(/,(\s*[}\]])/g, "$1")
        .replace(/[^\x20-\x7E\s]/g, "");

      try {
        const parsed = JSON.parse(jsonString);
        const chartConfig = parsed.chartConfig;

        // Check if chart config has valid data
        if (chartConfig && chartConfig.series) {
          const hasValidData = chartConfig.series.every(
            (series: ChartSeries) => {
              return (
                series.data &&
                Array.isArray(series.data) &&
                series.data.length > 0 &&
                !series.data.some(
                  (value: number | string) =>
                    typeof value === "string" &&
                    (value.includes("[values]") || value.includes("values"))
                )
              );
            }
          );

          if (!hasValidData) {
            console.warn(
              "Chart config contains placeholder data, skipping chart display"
            );
            return null;
          }
        }

        return chartConfig;
      } catch (parseError) {
        console.warn("Failed to parse JSON from regex match:", parseError);
      }
    }

    // Final fallback: try to find any JSON-like structure with chartConfig
    const fallbackMatch = content.match(/\{[\s\S]*?"chartConfig"[\s\S]*?\}/);
    if (fallbackMatch) {
      try {
        let jsonString = fallbackMatch[0];
        // More aggressive cleaning for fallback
        jsonString = jsonString
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "")
          .replace(/,(\s*[}\]])/g, "$1")
          .replace(/[^\x20-\x7E\s]/g, "");

        const parsed = JSON.parse(jsonString);
        const chartConfig = parsed.chartConfig;

        // Check if chart config has valid data
        if (chartConfig && chartConfig.series) {
          const hasValidData = chartConfig.series.every(
            (series: ChartSeries) => {
              return (
                series.data &&
                Array.isArray(series.data) &&
                series.data.length > 0 &&
                !series.data.some(
                  (value: number | string) =>
                    typeof value === "string" &&
                    (value.includes("[values]") || value.includes("values"))
                )
              );
            }
          );

          if (!hasValidData) {
            console.warn(
              "Chart config contains placeholder data, skipping chart display"
            );
            return null;
          }
        }

        return chartConfig;
      } catch (fallbackError) {
        console.warn("Final fallback JSON parsing also failed:", fallbackError);
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing chartConfig:", error);
    return null;
  }
}

// Function to remove chartConfig and Market Trend Summary from content for display
function removeChartConfigAndSummaryFromContent(content: string) {
  try {
    // First, try to remove markdown code blocks containing chartConfig
    let cleanedContent = content.replace(
      /```(?:json)?\s*\{[\s\S]*?"chartConfig"[\s\S]*?\}\s*```/g,
      ""
    );

    // Then, remove any remaining chartConfig JSON blocks
    cleanedContent = cleanedContent.replace(
      /\{\s*"chartConfig"\s*:\s*\{[\s\S]*?\}\s*\}/g,
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const chartConfig =
            message.role === "assistant"
              ? extractChartConfig(message.content)
              : null;
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
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="space-y-4">
                    <MarkdownRenderer
                      content={displayContent}
                      className="text-sm -mb-2"
                    />
                    {chartConfig && (
                      <div className="mt-4">
                        <ChartDisplay
                          chartConfig={chartConfig}
                          className="border-0 shadow-none"
                        />
                      </div>
                    )}
                    {(displayContent
                      .toLowerCase()
                      .includes("select a product category") ||
                      displayContent
                        .toLowerCase()
                        .includes("select a subcategory") ||
                      displayContent
                        .toLowerCase()
                        .includes("please select a product category") ||
                      displayContent
                        .toLowerCase()
                        .includes("please select a subcategory") ||
                      (displayContent.toLowerCase().includes("select") &&
                        displayContent.toLowerCase().includes("region"))) && (
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
            <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
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
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

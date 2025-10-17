"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MessageDisplay,
  MessageInput,
  ReportDisplay,
  ChartDisplay,
} from "@/components/chatbot";
import { ChatService, ChatMessage } from "@/lib/api";
import { useClientI18n } from "@/hooks/useClientI18n";
// Removed ResizablePanelGroup imports as we're using simple flex layout

export default function Home() {
  const { t } = useClientI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [deepSearchResults, setDeepSearchResults] = useState<unknown>(null);
  const [isWebSearchLoading, setIsWebSearchLoading] = useState(false);
  const [currentChartConfig, setCurrentChartConfig] = useState<unknown>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatSize, setChatSize] = useState({ width: 480, height: 600 });
  // Removed chatPosition state - using fixed CSS positioning instead

  // Function to extract chart configuration from message content
  const extractChartConfig = useCallback((content: string) => {
    console.log(
      "Extracting chart config from content:",
      content.substring(0, 500) + "..."
    );

    try {
      // First, try to find JSON within markdown code blocks
      const codeBlockMatch = content.match(
        /```(?:json)?\s*(\{[\s\S]*?(?:"chartConfig")[\s\S]*?\})\s*```/
      );

      if (codeBlockMatch) {
        console.log(
          "Found code block match:",
          codeBlockMatch[1].substring(0, 200) + "..."
        );
        let jsonString = codeBlockMatch[1];

        // Clean up common JSON issues
        jsonString = jsonString
          .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* comments */
          .replace(/\/\/.*$/gm, "") // Remove // comments
          .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
          .replace(/[^\x20-\x7E\s]/g, ""); // Remove non-printable characters

        try {
          const parsed = JSON.parse(jsonString);
          console.log("Parsed JSON successfully:", parsed);
          const chartConfig = parsed.chartConfig;

          if (chartConfig) {
            console.log("Found chart config:", chartConfig);
            return chartConfig;
          }
        } catch (parseError) {
          console.warn("Failed to parse JSON from code block:", parseError);
        }
      }

      // Fallback: Look for chartConfig in the content with more specific regex
      const chartConfigMatch = content.match(
        /\{\s*"(?:chartConfig)"\s*:\s*\{[\s\S]*?\}\s*\}/
      );

      if (chartConfigMatch) {
        console.log(
          "Found regex match:",
          chartConfigMatch[0].substring(0, 200) + "..."
        );
        let jsonString = chartConfigMatch[0];

        // Clean up common JSON issues
        jsonString = jsonString
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "")
          .replace(/,(\s*[}\]])/g, "$1")
          .replace(/[^\x20-\x7E\s]/g, "");

        try {
          const parsed = JSON.parse(jsonString);
          console.log("Parsed fallback JSON successfully:", parsed);
          const chartConfig = parsed.chartConfig;

          if (chartConfig) {
            console.log("Found fallback chart config:", chartConfig);
            return chartConfig;
          }
        } catch (parseError) {
          console.warn("Failed to parse JSON from regex match:", parseError);
        }
      }

      // Final fallback: try to find any JSON-like structure with chartConfig
      const fallbackMatch = content.match(/\{[\s\S]*?"chartConfig"[\s\S]*?\}/);
      if (fallbackMatch) {
        console.log(
          "Found fallback match:",
          fallbackMatch[0].substring(0, 200) + "..."
        );
        try {
          let jsonString = fallbackMatch[0];
          // More aggressive cleaning for fallback
          jsonString = jsonString
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*$/gm, "")
            .replace(/,(\s*[}\]])/g, "$1")
            .replace(/[^\x20-\x7E\s]/g, "");

          const parsed = JSON.parse(jsonString);
          console.log("Parsed final fallback JSON successfully:", parsed);
          const chartConfig = parsed.chartConfig;

          if (chartConfig) {
            console.log("Found final fallback chart config:", chartConfig);
            return chartConfig;
          }
        } catch (fallbackError) {
          console.warn(
            "Final fallback JSON parsing also failed:",
            fallbackError
          );
        }
      }

      console.log("No chart config found in content");
      return null;
    } catch (error) {
      console.error("Error parsing chartConfig:", error);
      return null;
    }
  }, []);

  // Function to trigger web search based on answer response
  const triggerWebSearch = useCallback(async (answer: string) => {
    setIsWebSearchLoading(true);
    try {
      const webSearchResult = await ChatService.performWebSearch(answer);
      setDeepSearchResults(webSearchResult);
    } catch (error) {
      console.error("Error performing web search:", error);
    } finally {
      setIsWebSearchLoading(false);
    }
  }, []);

  // Removed position useEffect - using fixed CSS positioning instead

  // Send initial message on component mount
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: ChatMessage = {
        id: "initial-" + Date.now().toString(),
        role: "assistant",
        content: t("page.initialMessage"),
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [messages.length, t]);

  const handleInteractiveSelection = useCallback(
    async (messageId: string, selection: string) => {
      console.log(
        "Page - Interactive selection received:",
        selection,
        "selectedCategory:",
        selectedCategory,
        "selectedSubcategory:",
        selectedSubcategory,
        "selectedRegion:",
        selectedRegion
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
        let assistantResponse = "";

        if (!selectedCategory) {
          console.log("Page - Setting selected category to:", selection);
          setSelectedCategory(selection);
          assistantResponse = t("page.selectSubcategory");
        } else if (!selectedSubcategory) {
          console.log("Page - Setting selected subcategory to:", selection);
          setSelectedSubcategory(selection);
          assistantResponse = t("page.selectRegion");
        } else if (!selectedRegion) {
          console.log("Page - Setting selected region to:", selection);
          setSelectedRegion(selection);

          // Check if all regions are selected (India, Singapore, Vietnam)
          const allRegionsSelected =
            selection.includes(t("page.regions.india")) &&
            selection.includes(t("page.regions.singapore")) &&
            selection.includes(t("page.regions.vietnam"));

          // Now generate the analysis with all selections
          const regionText = allRegionsSelected
            ? t("page.allRegions", {
                india: t("page.regions.india"),
                singapore: t("page.regions.singapore"),
                vietnam: t("page.regions.vietnam"),
              })
            : selection;
          const questionResponse = await ChatService.submitQuestion(
            t("page.analyzeMarket", {
              category: selectedCategory,
              subcategory: selectedSubcategory,
              region: regionText,
            }),
            messages
          );

          const answerResponse = await ChatService.getAnswer(
            questionResponse.message_id
          );

          assistantResponse = answerResponse.answer;

          // Extract and set chart configuration
          const chartConfig = extractChartConfig(answerResponse.answer);
          setCurrentChartConfig(chartConfig);

          // Trigger web search immediately after showing answer
          triggerWebSearch(answerResponse.answer);
        } else {
          // All selections made, generate analysis with the new region selection
          setSelectedRegion(selection);

          // Check if all regions are selected (India, Singapore, Vietnam)
          const allRegionsSelected =
            selection.includes(t("page.regions.india")) &&
            selection.includes(t("page.regions.singapore")) &&
            selection.includes(t("page.regions.vietnam"));

          const regionText = allRegionsSelected
            ? t("page.allRegions", {
                india: t("page.regions.india"),
                singapore: t("page.regions.singapore"),
                vietnam: t("page.regions.vietnam"),
              })
            : selection;
          const questionResponse = await ChatService.submitQuestion(
            t("page.analyzeMarket", {
              category: selectedCategory,
              subcategory: selectedSubcategory,
              region: regionText,
            }),
            messages
          );

          const answerResponse = await ChatService.getAnswer(
            questionResponse.message_id
          );

          assistantResponse = answerResponse.answer;

          // Extract and set chart configuration
          const chartConfig = extractChartConfig(answerResponse.answer);
          setCurrentChartConfig(chartConfig);

          // Trigger web search immediately after showing answer
          triggerWebSearch(answerResponse.answer);
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
    [
      messages,
      selectedCategory,
      selectedSubcategory,
      selectedRegion,
      t,
      extractChartConfig,
      triggerWebSearch,
    ]
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

        // Create initial assistant message for streaming
        const assistantMessageId = questionResponse.message_id;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Use streaming for real-time response
        await ChatService.getAnswerStream(
          questionResponse.message_id,
          (chunk) => {
            if (
              typeof chunk === "object" &&
              chunk !== null &&
              "type" in chunk
            ) {
              const chunkData = chunk as { type: string; data?: string };
              if (chunkData.type === "content") {
                // Hide loading indicator as soon as we start receiving content
                setIsLoading(false);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: msg.content + (chunkData.data || ""),
                        }
                      : msg
                  )
                );
              } else if (chunkData.type === "chart") {
                // Handle chart configuration
                try {
                  const chartConfig = JSON.parse(chunkData.data || "{}");
                  setCurrentChartConfig(chartConfig);
                } catch (e) {
                  console.warn("Failed to parse chart config:", e);
                }
              } else if (chunkData.type === "status") {
                // Hide loading indicator when we receive status updates
                setIsLoading(false);
                // Update status in the message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: msg.content + `\n\n*${chunkData.data}*`,
                        }
                      : msg
                  )
                );
              } else if (chunkData.type === "error") {
                // Hide loading indicator on error
                setIsLoading(false);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content:
                            msg.content + `\n\n**Error:** ${chunkData.data}`,
                        }
                      : msg
                  )
                );
              }
            }
          },
          (error) => {
            console.error("Streaming error:", error);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: msg.content + `\n\n**Error:** ${error.message}`,
                    }
                  : msg
              )
            );
          },
          () => {
            // On complete, trigger web search
            const finalMessage = messages.find(
              (msg) => msg.id === assistantMessageId
            );
            if (finalMessage) {
              triggerWebSearch(finalMessage.content);
            }
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error("Error sending message:", error);

        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: t("chat.error"),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
      }
    },
    [messages, t, triggerWebSearch]
  );

  return (
    <div className="w-full h-[calc(100%-48px)] bg-gradient-to-br from-blue-50 to-indigo-50 relative">
      {/* Main Screen - Chart (60%) and Report (40%) */}
      <div className="h-full flex">
        {/* Chart Section - 60% */}
        <div className="w-3/5 h-full border-r border-gray-200">
          <div className="h-full p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {t("common.chart")}
                </h2>
              </div>
            </div>

            {currentChartConfig ? (
              <div className="h-[calc(100%-80px)] bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <ChartDisplay
                  chartConfig={currentChartConfig}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="h-[calc(100%-80px)] bg-white rounded-xl shadow-lg border border-gray-200 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {t("page.noChartData")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("page.completeAnalysis")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Section - 40% */}
        <div className="w-2/5 h-full">
          <ReportDisplay
            deepSearchResults={deepSearchResults}
            isWebSearchLoading={isWebSearchLoading}
          />
        </div>
      </div>

      {/* Resizable Chat Window */}
      {isChatOpen ? (
        <div
          className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          style={{
            width: `${chatSize.width}px`,
            height: `${chatSize.height}px`,
            minWidth: "300px",
            minHeight: "400px",
            maxWidth: "80vw",
            maxHeight: "80vh",
          }}
        >
          <div className="h-full flex flex-col">
            {/* Chat Header - Fixed Height */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {t("page.marketAnalysisChat")}
                    </h3>
                    <p className="text-white/80 text-xs">
                      {t("page.askQuestions")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages - Fixed Height */}
            <div className="flex-1 overflow-hidden">
              <MessageDisplay
                messages={messages}
                isLoading={isLoading}
                onInteractiveSelection={handleInteractiveSelection}
                selectedCategory={selectedCategory || undefined}
              />
            </div>

            {/* Chat Input - Fixed Height */}
            <div className="flex-shrink-0 border-t border-gray-200">
              <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Resize Handles for Window - Only right and bottom for fixed positioning */}
          {/* Right */}
          <div
            className="absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/20 transition-colors"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startWidth = chatSize.width;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const newWidth = Math.max(
                  300,
                  Math.min(window.innerWidth - 48, startWidth + deltaX)
                );

                setChatSize((prev) => ({ ...prev, width: newWidth }));
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />

          {/* Bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startHeight = chatSize.height;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaY = e.clientY - startY;
                const newHeight = Math.max(
                  400,
                  Math.min(window.innerHeight - 48, startHeight + deltaY)
                );

                setChatSize((prev) => ({ ...prev, height: newHeight }));
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />

          {/* Bottom-Right Corner */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500/30 transition-colors"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = chatSize.width;
              const startHeight = chatSize.height;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                const newWidth = Math.max(
                  300,
                  Math.min(window.innerWidth - 48, startWidth + deltaX)
                );
                const newHeight = Math.max(
                  400,
                  Math.min(window.innerHeight - 48, startHeight + deltaY)
                );

                setChatSize({ width: newWidth, height: newHeight });
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />
        </div>
      ) : (
        /* Chat Toggle Button - When Closed */
        <button
          onClick={() => setIsChatOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center"
          aria-label={t("page.openChat")}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

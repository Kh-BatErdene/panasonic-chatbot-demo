"use client";

import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useClientI18n } from "@/hooks/useClientI18n";

interface ReportDisplayProps {
  summary?: string;
  className?: string;
  deepSearchResults?: unknown;
  enhancedAnalysis?: unknown;
  isWebSearchLoading?: boolean;
}

// Function to process web search results and format them for display
function processWebSearchResults(webSearchResults: unknown): string {
  if (!webSearchResults || typeof webSearchResults !== "object") return "";

  const results = webSearchResults as { output_text?: string };
  // Return the output_text from OpenAI web search
  if (results.output_text) {
    return results.output_text;
  }

  return "";
}

// Function to extract Market Trend Summary from web search results
function extractMarketSummaryFromWebSearch(
  webSearchResults: unknown
): string | null {
  if (
    !webSearchResults ||
    typeof webSearchResults !== "object" ||
    !("output_text" in webSearchResults)
  )
    return null;

  const results = webSearchResults as { output_text: string };
  const content = results.output_text;

  // Look for Market Trend Summary section
  const summaryMatch = content.match(
    /\*\*Market Trend Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
  );

  if (summaryMatch) {
    const summary = summaryMatch[1].trim();
    return summary;
  }

  // Fallback: look for any summary section
  const fallbackMatch = content.match(
    /\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
  );

  if (fallbackMatch) {
    const summary = fallbackMatch[1].trim();
    return summary;
  }

  return null;
}

// Function to extract Market Trend Summary from content
function extractMarketTrendSummary(content: string): string | null {
  try {
    // Look for Market Trend Summary section
    const summaryMatch = content.match(
      /\*\*Market Trend Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
    );

    if (summaryMatch) {
      let summary = summaryMatch[1].trim();

      // Remove any Graphic Configuration from the summary
      summary = summary
        .replace(/### Graphic Configuration:[\s\S]*$/i, "")
        .replace(/```json\s*\{[\s\S]*?(?:"chartConfig")[\s\S]*?\}\s*```/g, "")
        .replace(/\{\s*"(?:chartConfig)"\s*:\s*\{[\s\S]*?\}\s*\}/g, "")
        .trim();

      return summary;
    }

    // Fallback: look for any summary section
    const fallbackMatch = content.match(
      /\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
    );

    if (fallbackMatch) {
      let summary = fallbackMatch[1].trim();

      summary = summary
        .replace(/### Graphic Configuration:[\s\S]*$/i, "")
        .replace(/```json\s*\{[\s\S]*?(?:"chartConfig")[\s\S]*?\}\s*```/g, "")
        .replace(/\{\s*"(?:chartConfig)"\s*:\s*\{[\s\S]*?\}\s*\}/g, "")
        .trim();

      return summary;
    }

    return null;
  } catch (error) {
    console.error("Error extracting market trend summary:", error);
    return null;
  }
}

export function ReportDisplay({
  summary,
  className = "",
  deepSearchResults,
  isWebSearchLoading = false,
}: ReportDisplayProps) {
  const { t } = useClientI18n();

  const isValidMarketSummary = (
    content: string | null | undefined
  ): boolean => {
    if (!content || typeof content !== "string") return false;

    try {
      const parsed = JSON.parse(content);
      if (parsed.answer || parsed.message_id || parsed.status) {
        return false;
      }
    } catch {}

    const hasMarketKeywords =
      content.includes("Market Trend Summary") ||
      content.includes("Summary") ||
      content.includes("market analysis") ||
      content.includes("historical trend") ||
      content.includes("forecast") ||
      content.includes("insights") ||
      content.includes("recommendations") ||
      content.includes("data analysis") ||
      content.includes("market trends") ||
      content.includes("market data");

    // Must be substantial content (more than just a simple response)
    const isSubstantial = content.length > 200;

    return hasMarketKeywords && isSubstantial;
  };

  const extractedSummary =
    summary ||
    (typeof summary === "string" ? extractMarketTrendSummary(summary) : null);

  // Extract market summary from web search results instead of answer
  const webSearchMarketSummary = deepSearchResults
    ? extractMarketSummaryFromWebSearch(deepSearchResults)
    : null;

  // Use web search market summary if available, otherwise fall back to answer summary
  const displaySummary =
    webSearchMarketSummary ||
    (isValidMarketSummary(summary) ? summary : null) ||
    (isValidMarketSummary(extractedSummary) ? extractedSummary : null);

  // Process web search results (excluding the summary part)
  const webSearchContent = deepSearchResults
    ? processWebSearchResults(deepSearchResults)
    : "";

  // Combine content for display (only summary and web search results)
  const combinedContent = [displaySummary, webSearchContent]
    .filter(Boolean)
    .join("\n\n---\n\n");

  return (
    <div
      className={`h-full bg-gradient-to-br from-blue-50 to-indigo-50 overflow-y-auto ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {t("report.summaryTitle")}
          </h3>
        </div>

        {combinedContent ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
                <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                  {t("page.marketAnalysisReport")}
                </h4>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                  <MarkdownRenderer content={combinedContent} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-3">
              <h4 className="text-gray-600 font-semibold text-sm uppercase tracking-wide">
                {t("page.reportStatus")}
              </h4>
            </div>
            <div className="p-6">
              {isWebSearchLoading ? (
                <div className="flex items-center space-x-4">
                  <div className="animate-spin">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {t("report.webSearchLoading")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("page.analyzingMarketData")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    {t("report.noSummaryAvailable")}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t("page.completeMarketAnalysis")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

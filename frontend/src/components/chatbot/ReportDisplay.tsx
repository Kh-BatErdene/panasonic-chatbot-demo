"use client";

import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useClientI18n } from "@/hooks/useClientI18n";

interface ReportDisplayProps {
  summary?: string;
  className?: string;
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
        .replace(/```json\s*\{[\s\S]*?"chartConfig"[\s\S]*?\}\s*```/g, "")
        .replace(/\{\s*"chartConfig"\s*:\s*\{[\s\S]*?\}\s*\}/g, "")
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
        .replace(/```json\s*\{[\s\S]*?"chartConfig"[\s\S]*?\}\s*```/g, "")
        .replace(/\{\s*"chartConfig"\s*:\s*\{[\s\S]*?\}\s*\}/g, "")
        .trim();

      return summary;
    }

    return null;
  } catch (error) {
    console.error("Error extracting market trend summary:", error);
    return null;
  }
}

export function ReportDisplay({ summary, className = "" }: ReportDisplayProps) {
  const { t } = useClientI18n();

  // Validate that summary is a proper market summary, not plain text or JSON
  const isValidMarketSummary = (
    content: string | null | undefined
  ): boolean => {
    if (!content || typeof content !== "string") return false;

    // Check if it's a JSON response (which shouldn't be displayed as summary)
    try {
      const parsed = JSON.parse(content);
      if (parsed.answer || parsed.message_id || parsed.status) {
        return false; // This is a JSON response, not a market summary
      }
    } catch {
      // Not JSON, continue validation
    }

    // Check for simple greeting or help responses that should not be treated as market summaries
    const isSimpleResponse =
      content.includes("Hello!") ||
      content.includes("How can I assist") ||
      content.includes("How can I help") ||
      content.includes("feel free to ask") ||
      content.includes("let me know") ||
      content.includes("I'm here to help") ||
      content.includes("anything else you'd like") ||
      content.includes("questions about") ||
      content.includes("free to ask");

    if (isSimpleResponse) {
      return false;
    }

    // Check if it contains market analysis keywords
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

  // Only use the summary if it's a valid market summary
  const displaySummary = isValidMarketSummary(summary)
    ? summary
    : isValidMarketSummary(extractedSummary)
    ? extractedSummary
    : null;

  return (
    <div className={`h-full p-4 bg-gray-50 overflow-y-auto ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {t("report.summaryTitle")}
      </h3>
      {displaySummary && (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="text-sm text-gray-700 leading-relaxed">
              <MarkdownRenderer content={displaySummary} />
            </div>
          </div>
        </div>
      )}
      {!displaySummary && (
        <div className="p-4 bg-white rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500 italic">
            {t("report.noSummaryAvailable")}
          </p>
        </div>
      )}
    </div>
  );
}

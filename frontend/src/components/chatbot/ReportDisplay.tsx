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

  const extractedSummary =
    summary ||
    (typeof summary === "string" ? extractMarketTrendSummary(summary) : null);
  const displaySummary = summary || extractedSummary;

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

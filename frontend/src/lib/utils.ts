import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts market summary from assistant response content
 * Looks for JSON structure in the response and formats it as a readable string
 * Also handles Market Trend Summary section
 */
export function extractMarketSummary(content: string): string | null {
  try {
    // Debug logging
    console.log('Extracting market summary from content:', content.substring(0, 200) + '...');
    // Look for Market Summary section in the content
    const marketSummaryMatch = content.match(
      /Market Summary:\s*(\{[\s\S]*?\})/i
    );

    if (marketSummaryMatch) {
      const jsonString = marketSummaryMatch[1];
      const parsed = JSON.parse(jsonString);

      // Extract the marketSummary object from the parsed JSON
      if (parsed.marketSummary) {
        const summary = parsed.marketSummary;
        let formattedSummary = "";

        if (summary.title) {
          formattedSummary += `**${summary.title}**\n\n`;
        }

        if (summary.historicalTrend) {
          formattedSummary += `**Historical Trend (2015-2024):**\n${summary.historicalTrend}\n\n`;
        }

        if (summary.forecastOutlook) {
          formattedSummary += `**Forecast Outlook (2025-2028):**\n${summary.forecastOutlook}\n\n`;
        }

        if (summary.keyFindings && summary.keyFindings.length > 0) {
          formattedSummary += `**Key Findings:**\n`;
          summary.keyFindings.forEach((finding: string) => {
            formattedSummary += `• ${finding}\n`;
          });
          formattedSummary += "\n";
        }

        if (summary.insights && summary.insights.length > 0) {
          formattedSummary += `**Insights:**\n`;
          summary.insights.forEach((insight: string) => {
            formattedSummary += `• ${insight}\n`;
          });
          formattedSummary += "\n";
        }

        if (summary.recommendations && summary.recommendations.length > 0) {
          formattedSummary += `**Recommendations:**\n`;
          summary.recommendations.forEach((recommendation: string) => {
            formattedSummary += `• ${recommendation}\n`;
          });
        }

        return formattedSummary.trim();
      }
    }

    // If no JSON structure found, look for Market Trend Summary section
    // Try different patterns for Market Trend Summary
    const patterns = [
      // Pattern 1: **Market Trend Summary:** followed by content
      /\*\*Market Trend Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i,
      // Pattern 2: Market Trend Summary: (without **)
      /Market Trend Summary:\s*([\s\S]*?)(?=\*\*|$)/i,
      // Pattern 3: **Market Trend Summary:** with bullet points
      /\*\*Market Trend Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        console.log('Found Market Trend Summary match:', match[0].substring(0, 100) + '...');
        const trendSummary = match[1].trim();
        if (trendSummary) {
          // Clean up the content - remove leading dashes and format nicely
          const cleanedSummary = trendSummary
            .replace(/^-\s*/gm, '• ') // Replace leading dashes with bullets
            .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .trim();
          
          console.log('Extracted Market Trend Summary:', cleanedSummary.substring(0, 100) + '...');
          return `**Market Trend Summary:**\n\n${cleanedSummary}`;
        }
      }
    }
    
    console.log('No Market Trend Summary found in content');

    return null;
  } catch (error) {
    console.error("Error extracting market summary:", error);
    return null;
  }
}

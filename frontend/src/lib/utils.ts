import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractMarketSummary(content: string): string | null {
  try {
    console.log(
      "Extracting market summary from content:",
      content.substring(0, 200) + "..."
    );

    // First, look for Market Trend Summary section specifically
    const marketTrendSummaryMatch = content.match(
      /\*\*Market Trend Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
    );

    if (marketTrendSummaryMatch) {
      let summary = marketTrendSummaryMatch[1].trim();

      // Remove any Graphic Configuration from the summary
      summary = summary
        .replace(/### Graphic Configuration:[\s\S]*$/i, "")
        .replace(/```json\s*\{[\s\S]*?"chartConfig"[\s\S]*?\}\s*```/g, "")
        .replace(/\{\s*"chartConfig"\s*:\s*\{[\s\S]*?\}\s*\}/g, "")
        .trim();

      console.log(
        "Found Market Trend Summary:",
        summary.substring(0, 100) + "..."
      );
      return summary;
    }

    // Fallback: Look for any Summary section
    const summaryMatch = content.match(
      /\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
    );

    if (summaryMatch) {
      let summary = summaryMatch[1].trim();

      // Remove any Graphic Configuration from the summary
      summary = summary
        .replace(/### Graphic Configuration:[\s\S]*$/i, "")
        .replace(/```json\s*\{[\s\S]*?"chartConfig"[\s\S]*?\}\s*```/g, "")
        .replace(/\{\s*"chartConfig"\s*:\s*\{[\s\S]*?\}\s*\}/g, "")
        .trim();

      console.log("Found Summary section:", summary.substring(0, 100) + "...");
      return summary;
    }

    // Legacy support: Look for Market Summary JSON structure
    const cleanContent = content
      .replace(/```json\s*\{[\s\S]*?"chartConfig"[\s\S]*?\}\s*```/g, "")
      .replace(/\{\s*"chartConfig"\s*:\s*\{[\s\S]*?\}\s*\}/g, "")
      .replace(/### Graphic Configuration:[\s\S]*$/i, "")
      .trim();

    const marketSummaryMatch = cleanContent.match(
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

    // If no specific summary found, look for text summary patterns
    const patterns = [
      // Pattern 1: Look for text before "### Graphic Configuration"
      /^([\s\S]*?)(?=### Graphic Configuration:|```json|\{\s*"chartConfig")/i,
      // Pattern 2: Look for text summary patterns
      /(?:The historical trend|Historical trend|Forecast outlook|Market analysis)[\s\S]*?(?=###|```|\{|$)/i,
      // Pattern 3: Look for any meaningful text before JSON
      /^([\s\S]*?)(?=\{\s*"chartConfig"|```json)/i,
    ];

    for (const pattern of patterns) {
      const match = cleanContent.match(pattern);
      if (match) {
        const textSummary = match[1]?.trim();
        if (textSummary && textSummary.length > 50) {
          // Only if it's substantial content
          console.log(
            "Found text summary:",
            textSummary.substring(0, 100) + "..."
          );
          return textSummary;
        }
      }
    }

    // Fallback: return the clean content if it doesn't contain JSON
    if (
      !cleanContent.includes('"chartConfig"') &&
      !cleanContent.includes("```json")
    ) {
      return cleanContent;
    }

    console.log("No market summary found in content");
    return null;
  } catch (error) {
    console.error("Error extracting market summary:", error);
    return null;
  }
}

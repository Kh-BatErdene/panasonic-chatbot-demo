// Test the Market Trend Summary extraction with the provided response
const testResponse = `**Market Analysis: Clothes Dryer in Global, Japan, and China (2015-2028)**

**Data Overview:**
- Analyzing 9 years of historical data (2015-2024) and 5 years of forecasts (2025-2030).
- Covering global, Japan, and China markets for clothes dryers.

**Key Findings:**
- **Global Market Size**: 
  - In 2024, the market size for clothes dryers is projected to be approximately **XX million units**.
  - By 2028, it is expected to grow to **YY million units**.
- **Japan Market Size**: 
  - The market size in Japan for clothes dryers in 2024 is estimated at **AA million units**, with a forecast of **BB million units** by 2028.
- **China Market Size**: 
  - In China, the market size for clothes dryers is projected to reach **CC million units** in 2024, with an expected growth to **DD million units** by 2028.
- **Growth Rate**: 
  - The global market is expected to grow at a CAGR of **ZZ%** from 2025 to 2028.
  - Japan's market is projected to grow at a CAGR of **WW%** during the same period.
  - China's market is anticipated to grow at a CAGR of **VV%**.

**Trend Analysis:**
- **Historical Growth**: 
  - The global market for clothes dryers has shown a steady growth rate of **MM%** from 2015 to 2024.
  - Japan's market has experienced a growth rate of **NN%** over the same period.
  - China's market has been expanding rapidly, with a growth rate of **OO%**.
- **Forecast Outlook**: 
  - The global market is expected to continue its upward trend, driven by increasing urbanization and changing consumer lifestyles.
  - Japan's market may see moderate growth due to market saturation.
  - China's market is likely to witness significant growth due to rising disposable incomes and a growing middle class.

**Insights & Recommendations:**
- **Actionable Insights**: 
  - Companies should focus on innovative features and energy-efficient models to attract environmentally conscious consumers.
  - Marketing strategies should emphasize the convenience and time-saving aspects of clothes dryers.
- **Strategic Recommendations**: 
  - Invest in R&D to develop advanced technologies that cater to consumer preferences in different regions.
  - Explore partnerships with local retailers in China to enhance market penetration.

**Suggested Visualization:**
- A stacked bar chart showing the market size trends for clothes dryers in Global, Japan, and China from 2018 to 2028.

**Graphic Configuration:**
\`\`\`json
{
  "chartConfig": {
    "title": {
      "text": "Clothes Dryer Market Size by Region (2018-2028)",
      "subtext": "Source: Market Trend Data"
    },
    "tooltip": {
      "trigger": "axis",
      "axisPointer": {
        "type": "shadow"
      }
    },
    "legend": {
      "data": ["Global", "Japan", "China"]
    },
    "grid": {
      "left": "3%",
      "right": "4%",
      "bottom": "3%",
      "containLabel": true
    },
    "xAxis": {
      "type": "category",
      "data": ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028"]
    },
    "yAxis": {
      "type": "value",
      "name": "Market Size (Units in Millions)",
      "axisLabel": {
        "formatter": "{value}"
      }
    },
    "series": [
      {
        "name": "Global",
        "type": "bar",
        "stack": "total",
        "data": [values],  // Replace with actual values
        "itemStyle": {
          "color": "#4A90E2"
        }
      },
      {
        "name": "Japan",
        "type": "bar",
        "stack": "total",
        "data": [values],  // Replace with actual values
        "itemStyle": {
          "color": "#7ED321"
        }
      },
      {
        "name": "China",
        "type": "bar",
        "stack": "total",
        "data": [values],  // Replace with actual values
        "itemStyle": {
          "color": "#F5A623"
        }
      }
    ]
  }
}
\`\`\`

**Market Trend Summary:**
- The clothes dryer market has shown consistent growth from 2015 to 2024, with strong forecasts for the upcoming years. Global trends indicate a shift towards convenience and efficiency, particularly in emerging markets like China, while Japan's market may stabilize due to saturation. Companies should focus on innovation and strategic partnerships to capitalize on these trends.`;

// Test the Market Trend Summary extraction patterns
const patterns = [
  /\*\*Market Trend Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i,
  /Market Trend Summary:\s*([\s\S]*?)(?=\*\*|$)/i,
];

console.log("Testing Market Trend Summary extraction:");
console.log("=====================================");

patterns.forEach((pattern, index) => {
  const match = testResponse.match(pattern);
  if (match) {
    console.log(`✓ Pattern ${index + 1} matched!`);
    console.log("Extracted content:", match[1].trim());
  } else {
    console.log(`✗ Pattern ${index + 1} did not match`);
  }
});

"use client";

import React, { useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { Download } from "lucide-react";
import { useClientI18n } from "@/hooks/useClientI18n";
import * as XLSX from "xlsx";

// ECharts event parameter types
interface EChartsTooltipParams {
  axisValue: string;
  color: string;
  seriesName: string;
  value: number | string;
  dataIndex: number;
  seriesIndex: number;
}

interface EChartsLegendParams {
  name: string;
  selected: Record<string, boolean>;
}

interface EChartsClickParams {
  seriesName: string;
  name: string;
  value: number | string;
  dataIndex: number;
  seriesIndex: number;
}

interface ChartConfig {
  title?: {
    text?: string;
    subtext?: string;
    left?: string;
    top?: string;
    textStyle?: {
      fontSize?: number;
      fontWeight?: string;
      color?: string;
    };
    subtextStyle?: {
      fontSize?: number;
      color?: string;
    };
  };
  tooltip?: {
    trigger?: string;
    axisPointer?: {
      type?: string;
      shadowStyle?: {
        color?: string;
        opacity?: number;
      };
    };
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    textStyle?: {
      color?: string;
      fontSize?: number;
    };
    formatter?: string | ((value: number | string) => string);
  };
  legend?: {
    data?: string[];
    bottom?: string;
    left?: string;
    itemGap?: number;
    show?: boolean;
    textStyle?: {
      fontSize?: number;
      color?: string;
    };
    itemWidth?: number;
    itemHeight?: number;
  };
  grid?: {
    left?: string;
    right?: string;
    bottom?: string;
    top?: string;
    containLabel?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  xAxis?: {
    type?: string;
    data?: string[];
    name?: string;
    nameLocation?: string;
    nameGap?: number;
    nameTextStyle?: {
      color?: string;
      fontSize?: number;
    };
    axisLabel?: {
      formatter?: string | ((value: number | string) => string);
      color?: string;
      fontSize?: number;
      rotate?: number;
    };
    axisLine?: {
      show?: boolean;
      lineStyle?: {
        color?: string;
        width?: number;
      };
    };
    axisTick?: {
      show?: boolean;
      alignWithLabel?: boolean;
    };
  };
  yAxis?: {
    type?: string;
    name?: string;
    nameLocation?: string;
    nameGap?: number;
    nameTextStyle?: {
      color?: string;
      fontSize?: number;
    };
    axisLabel?: {
      formatter?: string | ((value: number | string) => string);
      color?: string;
      fontSize?: number;
    };
    axisLine?: {
      show?: boolean;
      lineStyle?: {
        color?: string;
        width?: number;
      };
    };
    splitLine?: {
      show?: boolean;
      lineStyle?: {
        color?: string;
        type?: string;
        opacity?: number;
      };
    };
    min?: number | "dataMin";
    max?: number | "dataMax";
  };
  series?: Array<{
    name?: string;
    type?: string;
    stack?: string;
    data?: number[];
    itemStyle?: {
      color?: string;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number | number[];
    };
    emphasis?: {
      itemStyle?: {
        color?: string;
        borderColor?: string;
        borderWidth?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
    label?: {
      show?: boolean;
      position?: string;
      formatter?: string | ((value: number | string) => string);
      color?: string;
      fontSize?: number;
    };
    markPoint?: {
      data?: Array<{
        type?: string;
        name?: string;
        coord?: number[];
        value?: number;
      }>;
    };
    markLine?: {
      data?: Array<{
        type?: string;
        name?: string;
      }>;
    };
    smooth?: boolean;
    symbol?: string;
    symbolSize?: number;
    lineStyle?: {
      width?: number;
      color?: string;
      type?: string;
    };
    areaStyle?: {
      color?: string;
      opacity?: number;
    };
  }>;
  color?: string[];
  backgroundColor?: string;
  textStyle?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  };
  animation?: boolean;
  animationDuration?: number;
  animationEasing?: string;
}

interface ChartDisplayProps {
  chartConfig?: ChartConfig;
  title?: string;
  className?: string;
}

export function ChartDisplay({
  chartConfig,
  title,
  className = "",
}: ChartDisplayProps) {
  const { t } = useClientI18n();

  // Extract tabular data from chart configuration
  const extractChartData = useCallback((config: ChartConfig) => {
    if (!config.series || !config.xAxis?.data) {
      return null;
    }

    const xAxisData = config.xAxis.data;
    const seriesData = config.series;

    // Create header row with proper naming
    const xAxisName = config.xAxis.name || "Category";
    const headers = [
      xAxisName,
      ...seriesData.map((series) => series.name || "Series"),
    ];

    // Create data rows
    const rows = xAxisData.map((category, index) => {
      const row: (string | number)[] = [category];
      seriesData.forEach((series) => {
        const value = series.data?.[index] || 0;
        // Format numbers appropriately
        const formattedValue =
          typeof value === "number" ? Number(value.toFixed(2)) : value;
        row.push(formattedValue);
      });
      return row;
    });

    // Add summary row if there are multiple series
    if (seriesData.length > 1) {
      const summaryRow: (string | number)[] = ["Total"];
      seriesData.forEach((series) => {
        const total =
          series.data?.reduce((sum, val) => sum + (val || 0), 0) || 0;
        summaryRow.push(Number(total.toFixed(2)));
      });
      rows.push(summaryRow);
    }

    return [headers, ...rows];
  }, []);

  // Handle chart download as Excel
  const handleDownload = useCallback(() => {
    if (chartConfig) {
      const chartData = extractChartData(chartConfig);

      if (chartData) {
        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Create worksheet from the chart data
        const ws = XLSX.utils.aoa_to_sheet(chartData);

        // Set column widths for better readability
        const colWidths = chartData[0].map((_, index) => {
          if (index === 0) return { wch: 15 }; // Category column
          return { wch: 12 }; // Data columns
        });
        ws["!cols"] = colWidths;

        // Add the worksheet to workbook
        const sheetName = (chartConfig.title?.text || "Chart Data").substring(
          0,
          31
        ); // Excel sheet name limit
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generate Excel file and download
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chart-data-${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback to JSON if data extraction fails
        const dataStr = JSON.stringify(chartConfig, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chart-config-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  }, [chartConfig, extractChartData]);

  if (!chartConfig) {
    return null;
  }

  const chartTitle = chartConfig.title?.text || title || t("common.chart");

  // Auto-generate missing chart configuration elements with fallback mechanism
  const autoGenerateConfig = (config: ChartConfig): ChartConfig => {
    const enhancedConfig = { ...config };

    // Auto-generate legend data if missing
    if (!enhancedConfig.legend?.data && enhancedConfig.series) {
      enhancedConfig.legend = {
        ...enhancedConfig.legend,
        data: enhancedConfig.series
          .map((s) => s.name)
          .filter((name): name is string => Boolean(name)),
        show: true,
        bottom: "10px",
        left: "center",
      };
    }

    // Auto-generate color palette if missing
    if (!enhancedConfig.color) {
      enhancedConfig.color = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#06B6D4",
        "#84CC16",
        "#F97316",
        "#EC4899",
        "#6B7280",
      ];
    }

    // Apply colors to series if missing
    if (enhancedConfig.series && enhancedConfig.color) {
      enhancedConfig.series = enhancedConfig.series.map((series, index) => ({
        ...series,
        itemStyle: {
          ...series.itemStyle,
          color:
            series.itemStyle?.color ||
            enhancedConfig.color![index % enhancedConfig.color!.length],
        },
      }));
    }

    // Fallback mechanism for incomplete configurations
    if (!enhancedConfig.xAxis?.data && enhancedConfig.series?.[0]?.data) {
      // Generate default xAxis data based on series data length
      const dataLength = enhancedConfig.series[0].data.length;
      enhancedConfig.xAxis = {
        ...enhancedConfig.xAxis,
        type: "category",
        data: Array.from({ length: dataLength }, (_, i) => `Year ${2020 + i}`),
      };
    }

    if (!enhancedConfig.yAxis) {
      enhancedConfig.yAxis = {
        type: "value",
        name: "Value",
      };
    }

    if (!enhancedConfig.title?.text) {
      enhancedConfig.title = {
        ...enhancedConfig.title,
        text: "Chart Analysis",
      };
    }

    return enhancedConfig;
  };

  const autoGeneratedConfig = autoGenerateConfig(chartConfig);

  // Enhanced chart configuration with improved styling and functionality
  const processedChartConfig = {
    ...autoGeneratedConfig,
    // Enhanced color palette for better visual appeal
    color: autoGeneratedConfig.color,
    // Enhanced title configuration
    title: {
      ...autoGeneratedConfig.title,
      left: "center",
      top: "20px",
      textStyle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        ...autoGeneratedConfig.title?.textStyle,
      },
      subtextStyle: {
        fontSize: 12,
        color: "#6B7280",
        ...autoGeneratedConfig.title?.subtextStyle,
      },
    },
    // Enhanced legend configuration
    legend: {
      ...autoGeneratedConfig.legend,
      bottom: "10px",
      left: "center",
      itemGap: 25,
      show: true,
      orient: "horizontal",
      textStyle: {
        fontSize: 12,
        color: "#374151",
        fontWeight: "500",
        ...autoGeneratedConfig.legend?.textStyle,
      },
      itemWidth: 14,
      itemHeight: 14,
      // Add interactive features
      selectedMode: true,
      // Better positioning for mobile
      top: "auto",
      right: "auto",
      // Enhanced styling
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      borderRadius: 8,
      padding: [8, 12],
      shadowBlur: 4,
      shadowColor: "rgba(0, 0, 0, 0.1)",
    },
    // Enhanced grid configuration
    grid: {
      ...autoGeneratedConfig.grid,
      top: "100px",
      left: "4%",
      right: "4%",
      bottom: "15%", // Reduced to accommodate enhanced legend
      containLabel: true,
      backgroundColor: "transparent",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      // Better spacing for mobile (will be handled by CSS media queries)
    },
    // Enhanced tooltip configuration
    tooltip: {
      ...autoGeneratedConfig.tooltip,
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#D1D5DB",
      borderWidth: 1,
      borderRadius: 8,
      textStyle: {
        color: "#374151",
        fontSize: 12,
        fontWeight: "500",
        ...autoGeneratedConfig.tooltip?.textStyle,
      },
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: "rgba(0, 0, 0, 0.1)",
          opacity: 0.3,
        },
        ...autoGeneratedConfig.tooltip?.axisPointer,
      },
      // Enhanced formatter for better legend integration
      formatter:
        autoGeneratedConfig.tooltip?.formatter ||
        function (params: EChartsTooltipParams | EChartsTooltipParams[]) {
          if (Array.isArray(params)) {
            let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].axisValue}</div>`;
            params.forEach((param: EChartsTooltipParams) => {
              const color = param.color;
              const name = param.seriesName;
              const value = param.value;
              result += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 2px; margin-right: 8px;"></span>
              <span style="flex: 1;">${name}:</span>
              <span style="font-weight: 600; margin-left: 8px;">${value}</span>
            </div>`;
            });
            return result;
          }
          return `${params.seriesName}: ${params.value}`;
        },
    },
    // Enhanced xAxis configuration
    xAxis: {
      ...autoGeneratedConfig.xAxis,
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: {
        color: "#374151",
        fontSize: 12,
        ...autoGeneratedConfig.xAxis?.nameTextStyle,
      },
      axisLabel: {
        color: "#6B7280",
        fontSize: 11,
        rotate: 0,
        ...autoGeneratedConfig.xAxis?.axisLabel,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#D1D5DB",
          width: 1,
        },
        ...autoGeneratedConfig.xAxis?.axisLine,
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
        ...autoGeneratedConfig.xAxis?.axisTick,
      },
    },
    // Enhanced yAxis configuration
    yAxis: {
      ...autoGeneratedConfig.yAxis,
      nameLocation: "middle",
      nameGap: 50,
      nameTextStyle: {
        color: "#374151",
        fontSize: 12,
        ...autoGeneratedConfig.yAxis?.nameTextStyle,
      },
      axisLabel: {
        color: "#6B7280",
        fontSize: 11,
        ...autoGeneratedConfig.yAxis?.axisLabel,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#D1D5DB",
          width: 1,
        },
        ...autoGeneratedConfig.yAxis?.axisLine,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#F3F4F6",
          type: "dashed",
          opacity: 0.5,
        },
        ...autoGeneratedConfig.yAxis?.splitLine,
      },
    },
    // Enhanced series configuration
    series: autoGeneratedConfig.series?.map((series) => ({
      ...series,
      itemStyle: {
        borderRadius: series.type === "bar" ? [4, 4, 0, 0] : undefined,
        borderWidth: 0,
        ...series.itemStyle,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.2)",
          ...series.emphasis?.itemStyle,
        },
        ...series.emphasis,
      },
      label: {
        show: false,
        position: "top",
        color: "#374151",
        fontSize: 10,
        ...series.label,
      },
      ...series,
    })),
    // Enhanced global text style
    textStyle: {
      color: "#374151",
      fontSize: 12,
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      ...autoGeneratedConfig.textStyle,
    },
    // Enhanced animation
    animation: true,
    animationDuration: 1000,
    animationEasing: "cubicOut",
    ...autoGeneratedConfig,
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-xl p-4 md:p-6 relative w-full ${className}`}
    >
      {/* Header with Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
        <div className="flex items-center">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-4 h-4 md:w-6 md:h-6 text-white"
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
          <div className="min-w-0 flex-1">
            <h3 className="text-base md:text-lg font-bold text-gray-800 truncate">
              {chartTitle}
            </h3>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-1.5 md:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title={t("page.downloadChartConfig")}
          >
            <Download className="size-3 md:size-4" />
          </button>
        </div>
      </div>

      {/* Chart Description for Screen Readers */}
      <div className="sr-only">
        <p>
          This chart displays {chartConfig.series?.length || 0} data series:{" "}
          {chartConfig.series
            ?.map((s) => s.name)
            .filter(Boolean)
            .join(", ") || "data series"}
          . The chart shows data for {chartConfig.xAxis?.data?.length || 0}{" "}
          categories: {chartConfig.xAxis?.data?.join(", ") || "categories"}.
          {chartConfig.legend?.show &&
            " Use the legend below to show or hide individual data series."}
        </p>
      </div>

      {/* Main Chart */}
      <div
        className="h-[calc(100%-120px)] md:h-[calc(100%-100px)] w-full bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 p-2 md:p-4"
        role="img"
        aria-label={`Chart: ${chartTitle}`}
        tabIndex={0}
      >
        <ReactECharts
          option={processedChartConfig}
          style={{ height: "100%", width: "100%" }}
          opts={{
            renderer: "canvas",
          }}
          notMerge={true}
          lazyUpdate={true}
          // Add responsive configuration and accessibility
          onEvents={{
            legendselectchanged: (params: EChartsLegendParams) => {
              // Handle legend click events for better interactivity
              console.log("Legend selection changed:", params);
              // Announce legend changes for screen readers
              if (typeof window !== "undefined" && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(
                  `Legend item ${params.name} ${
                    params.selected[params.name] ? "shown" : "hidden"
                  }`
                );
                utterance.volume = 0.1;
                window.speechSynthesis.speak(utterance);
              }
            },
            click: (params: EChartsClickParams) => {
              // Provide audio feedback for chart interactions
              if (typeof window !== "undefined" && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(
                  `Chart data point: ${params.seriesName} ${params.name} value ${params.value}`
                );
                utterance.volume = 0.1;
                window.speechSynthesis.speak(utterance);
              }
            },
          }}
        />
      </div>
    </div>
  );
}

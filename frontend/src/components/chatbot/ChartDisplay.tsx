"use client";

import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import { ZoomIn } from "lucide-react";
import { useClientI18n } from "@/hooks/useClientI18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChartConfig {
  title?: {
    text?: string;
    subtext?: string;
    left?: string;
  };
  tooltip?: {
    trigger?: string;
    axisPointer?: {
      type?: string;
    };
  };
  legend?: {
    data?: string[];
    bottom?: string;
  };
  grid?: {
    left?: string;
    right?: string;
    bottom?: string;
    top?: string;
    containLabel?: boolean;
  };
  xAxis?: {
    type?: string;
    data?: string[];
  };
  yAxis?: {
    type?: string;
    name?: string;
    axisLabel?: {
      formatter?: string;
    };
  };
  series?: Array<{
    name?: string;
    type?: string;
    stack?: string;
    data?: number[];
    itemStyle?: {
      color?: string;
    };
  }>;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!chartConfig) {
    return null;
  }

  const chartTitle = chartConfig.title?.text || title || t("common.chart");

  // Process chart config to fix layout issues
  const processedChartConfig = {
    ...chartConfig,
    title: {
      ...chartConfig.title,
      left: "center",
      top: "10px",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    legend: {
      ...chartConfig.legend,
      bottom: "0",
      left: "center",
      itemGap: 20,
    },
    grid: {
      ...chartConfig.grid,
      top: "80px",
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
    },
    tooltip: {
      ...chartConfig.tooltip,
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
  };

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm p-4 relative w-full ${className}`}
    >
      {/* Zoom Icon */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="absolute top-2 right-2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
            aria-label={t("common.zoomChart")}
          >
            <ZoomIn className="size-4 text-gray-600" />
          </button>
        </DialogTrigger>

        {/* Dialog Content */}
        <DialogContent className="w-full max-h-[90vh] overflow-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              {chartTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] w-full">
            <ReactECharts
              option={processedChartConfig}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Chart */}
      <div className="h-96 w-full">
        <ReactECharts
          option={processedChartConfig}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
    </div>
  );
}

"use client";

import React from "react";

interface ReportDisplayProps {
  summary?: string;
  className?: string;
}

export function ReportDisplay({ summary, className = "" }: ReportDisplayProps) {
  return (
    <div className={`h-full p-4 bg-gray-50 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Market Analysis Report
      </h3>
      {summary && (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <p className="text-sm text-gray-600">
              {summary.replace("**Market Trend Summary:**", "")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ChipSelector } from "./ChipSelector";
import { ChatService } from "@/lib/api";
import { useClientI18n } from "@/hooks/useClientI18n";

interface InteractiveMessageProps {
  messageId: string;
  messageContent: string;
  onSelection: (selection: string) => void;
  isLoading?: boolean;
  selectedCategory?: string;
}

type SelectionType = "category" | "subcategory" | "region";

export function InteractiveMessage({
  messageContent,
  onSelection,
  isLoading = false,
  selectedCategory,
}: InteractiveMessageProps) {
  const { t } = useClientI18n();
  const [options, setOptions] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectionType, setSelectionType] = useState<SelectionType | null>(
    null
  );
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    const content = messageContent.toLowerCase();
    console.log("InteractiveMessage - Message content:", content);

    // Use English keywords for detection to avoid translation dependency
    if (
      content.includes("select a product category") ||
      content.includes("product category") ||
      content.includes("please select a product category")
    ) {
      console.log("InteractiveMessage - Setting selection type to category");
      setSelectionType("category");
    } else if (
      content.includes("select a subcategory") ||
      content.includes("subcategory") ||
      content.includes("please select a subcategory")
    ) {
      console.log("InteractiveMessage - Setting selection type to subcategory");
      setSelectionType("subcategory");
    } else if (content.includes("select") && content.includes("region")) {
      console.log("InteractiveMessage - Setting selection type to region");
      setSelectionType("region");
    } else if (
      content.includes("analysis") &&
      content.includes("global") &&
      content.includes("region")
    ) {
      console.log(
        "InteractiveMessage - Setting selection type to region (analysis)"
      );
      setSelectionType("region");
    } else {
      console.log("InteractiveMessage - No matching selection type found");
    }
  }, [messageContent]);

  // Load options based on selection type
  useEffect(() => {
    if (!selectionType) return;

    console.log(
      "InteractiveMessage - Loading options for selection type:",
      selectionType,
      "selectedCategory:",
      selectedCategory
    );

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        let response;
        switch (selectionType) {
          case "category":
            console.log("InteractiveMessage - Loading categories");
            response = await ChatService.getProductCategories();
            console.log(
              "InteractiveMessage - Categories loaded:",
              response.categories
            );
            setOptions(response.categories);
            break;
          case "subcategory":
            console.log(
              "InteractiveMessage - Loading subcategories for category:",
              selectedCategory
            );
            // Get subcategories for the selected category
            response = await ChatService.getSubcategories(selectedCategory);
            console.log(
              "InteractiveMessage - Subcategories loaded:",
              response.subcategories
            );
            setOptions(response.subcategories);
            break;
          case "region":
            console.log("InteractiveMessage - Loading regions");
            response = await ChatService.getRegions();
            console.log(
              "InteractiveMessage - Regions loaded:",
              response.regions
            );
            setOptions(response.regions);
            break;
        }
      } catch (error) {
        console.error("InteractiveMessage - Error loading options:", error);
        setOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [selectionType, selectedCategory]);

  const handleSelectionChange = (selected: string[]) => {
    console.log(
      "InteractiveMessage - Selection changed:",
      selected,
      "selectionType:",
      selectionType
    );
    setSelectedValues(selected);

    // For single selection (category, subcategory), send immediately
    if (selectionType === "category" || selectionType === "subcategory") {
      if (selected.length > 0) {
        console.log("InteractiveMessage - Sending selection:", selected[0]);
        onSelection(selected[0]);
      }
    }
    // For multiple selection (regions), wait for user to confirm
  };

  const handleConfirmSelection = () => {
    if (selectedValues.length > 0) {
      // Join multiple selections with commas
      onSelection(selectedValues.join(", "));
    }
  };

  if (!selectionType || loadingOptions) {
    return null;
  }

  return (
    <div className="mt-4 mb-2 p-4 bg-gray-50 rounded-lg border">
      <ChipSelector
        options={options}
        selectedValues={selectedValues}
        onSelectionChange={handleSelectionChange}
        placeholder={t("chipSelector.searchPlaceholder", {
          type: selectionType,
        })}
        searchable={selectionType !== "subcategory"}
        multiple={selectionType === "region"}
        className="max-w-full"
      />

      {selectionType === "region" && selectedValues.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleConfirmSelection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? t("interactive.sending")
              : t("interactive.confirmSelection")}
          </button>
        </div>
      )}
    </div>
  );
}

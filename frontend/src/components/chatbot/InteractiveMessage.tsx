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
  const [hasSelectionBeenSent, setHasSelectionBeenSent] = useState(false);

  useEffect(() => {
    const content = messageContent.toLowerCase();
    console.log("InteractiveMessage - Message content:", content);

    // Use localized keywords for detection with fallbacks
    const initialMessage = t("page.initialMessage").toLowerCase();
    const selectSubcategory = t("page.selectSubcategory").toLowerCase();
    const selectRegion = t("page.selectRegion").toLowerCase();

    console.log("InteractiveMessage - Detection strings:", {
      initialMessage,
      selectSubcategory,
      selectRegion,
    });

    // Category detection - more flexible patterns
    if (
      content.includes(initialMessage) ||
      content.includes("product category") ||
      (content.includes("product") && content.includes("category")) ||
      content.includes("please select a product category") ||
      content.includes("製品カテゴリ") // Japanese for product category
    ) {
      console.log("InteractiveMessage - Setting selection type to category");
      setSelectionType("category");
    }
    // Subcategory detection
    else if (
      content.includes(selectSubcategory) ||
      content.includes("subcategory") ||
      content.includes("please select a subcategory") ||
      content.includes("サブカテゴリ") // Japanese for subcategory
    ) {
      console.log("InteractiveMessage - Setting selection type to subcategory");
      setSelectionType("subcategory");
    }
    // Region detection
    else if (
      content.includes(selectRegion) ||
      (content.includes("select") && content.includes("region")) ||
      content.includes("please select a region") ||
      content.includes("地域") // Japanese for region
    ) {
      console.log("InteractiveMessage - Setting selection type to region");
      setSelectionType("region");
    } else {
      console.log("InteractiveMessage - No matching selection type found");
    }
  }, [messageContent, t]);

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
        setHasSelectionBeenSent(true);
        onSelection(selected[0]);
      }
    }
    // For multiple selection (regions), wait for user to confirm
    // But if "All" is selected, send immediately
    if (
      selectionType === "region" &&
      selected.includes(t("page.allRegionsOption"))
    ) {
      console.log("InteractiveMessage - Sending 'All' selection");
      setHasSelectionBeenSent(true);
      onSelection(t("page.allRegionsOption"));
    }
  };

  const handleConfirmSelection = () => {
    if (selectedValues.length > 0) {
      // Join multiple selections with commas
      setHasSelectionBeenSent(true);
      onSelection(selectedValues.join(", "));
    }
  };

  const handleChipSelectionChange = (selected: string[]) => {
    // If clearing all selections (empty array), re-enable the interface
    if (selected.length === 0 && selectedValues.length > 0) {
      setHasSelectionBeenSent(false);
    }

    // Call the original handler
    handleSelectionChange(selected);
  };

  if (!selectionType || loadingOptions) {
    return null;
  }

  return (
    <div className="mt-4 mb-2 p-4 bg-gray-50 rounded-lg border">
      <ChipSelector
        options={options}
        selectedValues={selectedValues}
        onSelectionChange={handleChipSelectionChange}
        placeholder={t("chipSelector.searchPlaceholder", {
          type: selectionType,
        })}
        searchable={false}
        multiple={selectionType === "region"}
        className="max-w-full"
        disabled={hasSelectionBeenSent}
      />

      {selectionType === "region" && selectedValues.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleConfirmSelection}
            disabled={isLoading || hasSelectionBeenSent}
            className="px-4 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

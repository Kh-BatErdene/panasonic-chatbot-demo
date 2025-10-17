"use client";

import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "../ui/input-group";
import { useClientI18n } from "@/hooks/useClientI18n";

export function MessageInput({
  onSendMessage,
  isLoading = false,
}: {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}) {
  const { t } = useClientI18n();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200">
      <form onSubmit={handleSubmit} className="p-3">
        <InputGroup>
          <InputGroupTextarea
            placeholder={t("chat.placeholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="resize-none text-sm"
            rows={2}
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              type="submit"
              variant="default"
              className="rounded-full ml-auto bg-blue-600 hover:bg-blue-700"
              size="icon-sm"
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useClientI18n } from "@/hooks/useClientI18n";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useLanguageStore } from "@/stores/languageStore";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useClientI18n();
  const { setLanguage, currentLanguage } = useLanguageStore();
  return (
    <div
      className="h-12 flex items-center justify-between p-2 border-b
"
    >
      <Image src="/panasonic-demo-logo.png" width={96} height={46} alt="logo" />
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <div className="size-8 rounded-full flex items-center justify-center border cursor-pointer hover:bg-accent hover:text-accent-foreground">
            <Languages size={15} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-4">
          <DropdownMenuLabel>{t("languages.label")}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setLanguage("en")}
            className={cn(currentLanguage === "en" && "bg-accent")}
          >
            {t("languages.en")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLanguage("ja")}
            className={cn(currentLanguage === "ja" && "bg-accent")}
          >
            {t("languages.ja")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

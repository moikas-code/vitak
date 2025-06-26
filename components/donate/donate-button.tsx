"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { DonateModal } from "./donate-modal";
import { cn } from "@/lib/utils/cn";
import { track_feature_event } from "@/lib/analytics";

interface DonateButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function DonateButton({ 
  variant = "default", 
  size = "default",
  className,
  showText = true 
}: DonateButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => {
          track_feature_event('donate');
          setIsModalOpen(true);
        }}
        className={cn("gap-2", className)}
      >
        <Heart className="h-4 w-4" />
        {showText && "Support VitaK"}
      </Button>
      <DonateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
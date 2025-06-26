"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { FeedbackModal } from "./feedback-modal";
import { cn } from "@/lib/utils/cn";

interface FeedbackButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function FeedbackButton({ 
  variant = "default", 
  size = "default",
  className,
  showText = true 
}: FeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={cn("gap-2", className)}
      >
        <MessageSquare className="h-4 w-4" />
        {showText && "Feedback"}
      </Button>
      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
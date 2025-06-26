"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  variant?: "default" | "outline";
  className?: string;
  children?: React.ReactNode;
}

export function PrintButton({ variant = "outline", className, children }: PrintButtonProps) {
  const handle_print = () => {
    window.print();
  };

  return (
    <Button variant={variant} className={className} onClick={handle_print}>
      {children || (
        <>
          <Printer className="mr-2 h-4 w-4" />
          Print Chart
        </>
      )}
    </Button>
  );
}
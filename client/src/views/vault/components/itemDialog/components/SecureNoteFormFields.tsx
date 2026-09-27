"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SecureNoteFormFieldsProps {
  content: string;
  onContentChange: (value: string) => void;
}

export function SecureNoteFormFields({
  content,
  onContentChange,
}: SecureNoteFormFieldsProps) {
  return (
    <div className="space-y-2.5">
      <Label
        htmlFor="content"
        className="text-slate-700 dark:text-slate-300 font-medium"
      >
        Secure Content
      </Label>
      <Textarea
        id="content"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        rows={8}
        required
        className="rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
      />
    </div>
  );
}

"use client";

import React from "react";
import { VaultItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useItemForm } from "./hooks";
import {
  ItemTypeSelector,
  LoginFormFields,
  SecureNoteFormFields,
} from "./components";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VaultItem | null;
}

function ItemDialogForm({
  item,
  onClose,
}: {
  item: VaultItem | null;
  onClose: () => void;
}) {
  const {
    type,
    setType,
    title,
    setTitle,
    username,
    setUsername,
    password,
    setPassword,
    url,
    setUrl,
    notes,
    setNotes,
    content,
    setContent,
    showPassword,
    setShowPassword,
    isSaving,
    handleGeneratePassword,
    handleSubmit,
  } = useItemForm({ item, onSuccess: onClose });

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader className="pb-2">
        <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {item ? "Edit Item" : "Add New Item"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 py-4">
        {!item && <ItemTypeSelector type={type} onTypeChange={setType} />}

        <div className="space-y-2.5">
          <Label
            htmlFor="title"
            className="text-slate-700 dark:text-slate-300 font-medium"
          >
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
          />
        </div>

        {type === "login" ? (
          <LoginFormFields
            username={username}
            onUsernameChange={setUsername}
            password={password}
            onPasswordChange={setPassword}
            url={url}
            onUrlChange={setUrl}
            notes={notes}
            onNotesChange={setNotes}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            onGeneratePassword={handleGeneratePassword}
          />
        ) : (
          <SecureNoteFormFields
            content={content}
            onContentChange={setContent}
          />
        )}
      </div>

      <DialogFooter className="pt-4 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 rounded-b-2xl border-t bg-muted/50">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-11 rounded-xl min-w-[4.5rem]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-11 min-w-[4.5rem] rounded-xl font-medium shadow-sm"
          isLoading={isSaving}
        >
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-6 sm:p-8">
        {open && (
          <ItemDialogForm
            key={item?.id ?? "new"}
            item={item}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

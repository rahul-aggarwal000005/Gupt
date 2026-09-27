"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

interface LoginFormFieldsProps {
  username: string;
  onUsernameChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  url: string;
  onUrlChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  onGeneratePassword: () => void;
}

export function LoginFormFields({
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  url,
  onUrlChange,
  notes,
  onNotesChange,
  showPassword,
  onToggleShowPassword,
  onGeneratePassword,
}: LoginFormFieldsProps) {
  return (
    <>
      <div className="space-y-2.5">
        <Label
          htmlFor="username"
          className="text-slate-700 dark:text-slate-300 font-medium"
        >
          Username / Email
        </Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <Label
            htmlFor="password"
            className="text-slate-700 dark:text-slate-300 font-medium"
          >
            Password
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onGeneratePassword}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Generate
          </Button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500 pr-10"
          />
          <button
            type="button"
            onClick={onToggleShowPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <Label
          htmlFor="url"
          className="text-slate-700 dark:text-slate-300 font-medium"
        >
          URL
        </Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://"
          className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
        />
      </div>

      <div className="space-y-2.5">
        <Label
          htmlFor="notes"
          className="text-slate-700 dark:text-slate-300 font-medium"
        >
          Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
        />
      </div>
    </>
  );
}

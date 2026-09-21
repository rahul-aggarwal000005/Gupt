import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { VaultItem, VaultItemType, useVaultStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { generatePassword } from "@/lib/password";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VaultItem | null;
}

export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
  const { addItem, updateItem } = useVaultStore();

  const [type, setType] = useState<VaultItemType>("login");
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [content, setContent] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (item) {
      setType(item.type);
      setTitle(item.title);
      if (item.type === "login") {
        setUsername(item.username || "");
        setPassword(item.password || "");
        setUrl(item.url || "");
        setNotes(item.notes || "");
      } else {
        setContent(item.content || "");
      }
    } else {
      // Reset form for new item
      setType("login");
      setTitle("");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
      setContent("");
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const baseData = {
      title,
      updatedAt: new Date().toISOString(),
    };

    if (item) {
      // Update existing
      if (type === "login") {
        await updateItem(item.id, {
          ...item,
          ...baseData,
          type: "login",
          username,
          password,
          url,
          notes,
        });
      } else {
        await updateItem(item.id, {
          ...item,
          ...baseData,
          type: "secure_note",
          content,
        });
      }
    } else {
      // Create new
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      if (type === "login") {
        await addItem({
          id,
          createdAt,
          ...baseData,
          type: "login",
          username,
          password,
          url,
          notes,
        });
      } else {
        await addItem({
          id,
          createdAt,
          ...baseData,
          type: "secure_note",
          content,
        });
      }
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-6 sm:p-8">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {item ? "Edit Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {!item && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "login" ? "default" : "outline"}
                  onClick={() => setType("login")}
                  className="flex-1 h-11 rounded-xl"
                >
                  Login
                </Button>
                <Button
                  type="button"
                  variant={type === "secure_note" ? "default" : "outline"}
                  onClick={() => setType("secure_note")}
                  className="flex-1 h-11 rounded-xl"
                >
                  Secure Note
                </Button>
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="title" className="text-slate-700 dark:text-slate-300 font-medium">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
              />
            </div>

            {type === "login" ? (
              <>
                <div className="space-y-2.5">
                  <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium">Username / Email</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const newPassword = generatePassword({
                          length: 16,
                          uppercase: true,
                          lowercase: true,
                          numbers: true,
                          symbols: true,
                        });
                        setPassword(newPassword);
                        setShowPassword(true);
                      }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Generate
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
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
                  <Label htmlFor="url" className="text-slate-700 dark:text-slate-300 font-medium">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                    className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <Label htmlFor="content" className="text-slate-700 dark:text-slate-300 font-medium">Secure Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                  className="rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

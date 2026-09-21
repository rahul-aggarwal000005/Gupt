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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!item && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "login" ? "default" : "outline"}
                  onClick={() => setType("login")}
                  className="flex-1"
                >
                  Login
                </Button>
                <Button
                  type="button"
                  variant={type === "secure_note" ? "default" : "outline"}
                  onClick={() => setType("secure_note")}
                  className="flex-1"
                >
                  Secure Note
                </Button>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {type === "login" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username / Email</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
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
                      className="pr-10"
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
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="content">Secure Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

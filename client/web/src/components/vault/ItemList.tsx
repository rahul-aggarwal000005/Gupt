import { VaultItem, useVaultStore } from '@/lib/store';
import { Key, FileText, MoreVertical, Copy, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { toast } from 'sonner';

interface ItemListProps {
  items: VaultItem[];
  onEdit: (item: VaultItem) => void;
}

export function ItemList({ items, onEdit }: ItemListProps) {
  const deleteItem = useVaultStore((state) => state.deleteItem);

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500">
        No items found in this category.
      </div>
    );
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Password copied', {
        description: 'Clipboard will clear in 30 seconds',
      });
      
      // Clear clipboard after 30 seconds
      setTimeout(async () => {
        try {
          const currentClipboard = await navigator.clipboard.readText();
          if (currentClipboard === text) {
            await navigator.clipboard.writeText('');
            toast.info('Clipboard cleared for security');
          }
        } catch (err) {
          console.error('Failed to clear clipboard', err);
        }
      }, 30000);
    } catch (err) {
      toast.error('Failed to copy password');
    }
  };

  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg shrink-0">
              {item.type === 'login' ? <Key className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="truncate">
              <h3 className="font-medium truncate">{item.title}</h3>
              {item.type === 'login' && item.username && (
                <p className="text-sm text-neutral-500 truncate">{item.username}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {item.type === 'login' && item.password && (
              <Button variant="ghost" size="icon" onClick={() => handleCopy(item.password!)} title="Copy Password">
                <Copy className="w-4 h-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this item?')) {
                      deleteItem(item.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
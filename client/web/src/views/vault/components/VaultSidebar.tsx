"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, FileText } from "lucide-react";

export interface VaultSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalCount: number;
  loginCount: number;
  noteCount: number;
}

export function VaultSidebar({
  activeTab,
  onTabChange,
  totalCount,
  loginCount,
  noteCount,
}: VaultSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full md:w-64 shrink-0"
    >
      <Card className="border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
        <CardContent className="p-3">
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            orientation="vertical"
            className="w-full"
          >
            <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-0">
              <TabsTrigger
                value="all"
                className="w-full justify-start rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                All Items ({totalCount})
              </TabsTrigger>
              <TabsTrigger
                value="logins"
                className="w-full justify-start rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Key className="w-4 h-4 mr-2" /> Logins ({loginCount})
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="w-full justify-start rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" /> Secure Notes ({noteCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

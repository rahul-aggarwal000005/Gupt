"use client";

import { useState } from "react";
import Image from "next/image";
import { Key } from "lucide-react";
import { faviconImUrl, hostnameFromUrl } from "@/lib/favicon";

interface LoginItemIconProps {
  url?: string;
}

export function LoginItemIcon({ url }: LoginItemIconProps) {
  const [failed, setFailed] = useState(false);
  const hostname = hostnameFromUrl(url);
  const showFavicon = Boolean(hostname && !failed);

  return (
    <div
      className={
        showFavicon
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 text-blue-600 shadow-sm dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400"
      }
    >
      {showFavicon && hostname ? (
        <Image
          src={faviconImUrl(hostname)}
          alt=""
          unoptimized
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          loading="lazy"
          onError={() => {
            console.error("Failed to load favicon for", hostname);
            setFailed(true);
          }}
        />
      ) : (
        <Key className="h-5 w-5" />
      )}
    </div>
  );
}

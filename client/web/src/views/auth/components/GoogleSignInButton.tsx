"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

type GoogleSignInButtonProps = {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Register page: "signup_with"; login: "continue_with" */
  mode?: "signin" | "signup";
};

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled,
  loading,
  mode = "signin",
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const next = Math.floor(el.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  const text = mode === "signup" ? "signup_with" : "continue_with";
  const inactive = Boolean(disabled || loading);

  function handleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      onError?.();
      return;
    }
    onSuccess(response.credential);
  }

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-11 flex items-center justify-center ${
        inactive ? "pointer-events-none opacity-60" : ""
      }`}
      aria-busy={loading}
    >
      {width > 0 && (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError?.()}
          theme="outline"
          size="large"
          shape="rectangular"
          text={text}
          width={width}
          logo_alignment="left"
          containerProps={{ className: "w-full flex justify-center" }}
        />
      )}
    </div>
  );
}

"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function SyncUser() {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      void fetch("/api/sync-user", { method: "POST" });
    }
  }, [isSignedIn]);

  return null;
}

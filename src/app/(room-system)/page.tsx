"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function RoomSystemRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the join-room page
    router.push("/join-room");
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      <p className="text-amber-700">Redirecting to drawing rooms...</p>
    </div>
  );
}

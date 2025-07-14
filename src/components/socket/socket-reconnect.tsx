"use client";

import { useSocket } from "@/lib/providers/socket-provider";
import { useSocketReconnect } from "@/hooks/useSocketReconnect";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface SocketReconnectProps {
  className?: string;
}

export const SocketReconnect = ({ className }: SocketReconnectProps) => {
  const { isConnected } = useSocket();
  const { isReconnecting, reconnectError, triggerReconnect } =
    useSocketReconnect();
  const [showReconnect, setShowReconnect] = useState(false);

  // Only show the reconnect button after a brief delay to prevent flashing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isConnected && !isReconnecting) {
      timeoutId = setTimeout(() => {
        setShowReconnect(true);
      }, 2000); // Show after 2 seconds of disconnection
    } else {
      setShowReconnect(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConnected, isReconnecting]);

  if (isConnected || !showReconnect) {
    return null;
  }

  return (
    <div
      className={`rounded-md border border-amber-200 bg-amber-50 p-4 ${className}`}
    >
      <div className="mb-2 flex items-center space-x-2">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <h3 className="text-sm font-medium text-amber-800">Connection lost</h3>
      </div>

      <p className="mb-3 text-sm text-amber-700">
        Connection to the game server has been lost. Please reconnect to
        continue.
      </p>

      {reconnectError && (
        <p className="mb-3 text-sm text-red-600">{reconnectError}</p>
      )}

      <Button
        size="sm"
        variant="outline"
        className="border-amber-300 bg-white text-amber-700 hover:bg-amber-100"
        disabled={isReconnecting}
        onClick={triggerReconnect}
      >
        {isReconnecting ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Reconnecting...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reconnect
          </>
        )}
      </Button>
    </div>
  );
};

export default SocketReconnect;

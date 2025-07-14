import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useAuth } from "@/lib/providers/auth-provider";

export function useSocketReconnect() {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectError, setReconnectError] = useState<string | null>(null);
  const { isConnected, connecting, connect } = useSocket();
  const { isAuthenticated } = useAuth();

  // Function to manually trigger reconnection
  const triggerReconnect = useCallback(async () => {
    if (!isAuthenticated) {
      setReconnectError("Not authenticated. Please log in first.");
      return false;
    }

    if (isConnected) {
      return true; // Already connected
    }

    if (connecting || isReconnecting) {
      return false; // Already trying to connect
    }

    setIsReconnecting(true);
    setReconnectError(null);

    try {
      await connect();
      setReconnectError(null);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reconnect";
      setReconnectError(errorMessage);
      return false;
    } finally {
      setIsReconnecting(false);
    }
  }, [isAuthenticated, isConnected, connecting, isReconnecting, connect]);

  // Auto reconnect when connection is lost but user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isConnected && !connecting && !isReconnecting) {
      // Add a slight delay before reconnection attempt
      const timeoutId = setTimeout(() => {
        triggerReconnect();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    isAuthenticated,
    isConnected,
    connecting,
    isReconnecting,
    triggerReconnect,
  ]);

  return {
    isReconnecting,
    reconnectError,
    triggerReconnect,
  };
}

export default useSocketReconnect;

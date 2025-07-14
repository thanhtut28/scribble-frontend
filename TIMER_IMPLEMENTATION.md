# Server-Side Timer Implementation Guide

This guide explains the timer synchronization changes made to the multiplayer drawing game to ensure consistent timer experiences for all players.

## Problem

Previously, the timer was managed client-side with each player calculating their own timer independently. This led to issues where:

1. Timers were not synchronized between players
2. A client might end a round at a different time than another client
3. The timer resets when drawing updates occurred
4. Correct guesses didn't properly sync timer resets

## Solution Overview

The solution implements a server-controlled timer system with these components:

1. Server maintains the authoritative timer state for each active game
2. Regular timer updates are broadcast to all clients
3. Client-side code displays timer based on server updates
4. Fallback mechanisms in case of missed updates

## Implementation Details

### 1. Server-Side (reference implementation)

The reference implementation in `src/server-side-reference/game.gateway.reference.ts` shows:

- Storage of active timers per game
- Broadcasting timer updates to all players
- Handling timer expiration
- Providing direct timer query support

Key functions:

- `startGameTimer(gameId, roundId)`: Start a timer for a round
- `updateGameTimer(gameId, roundId)`: Calculate and broadcast timer updates
- `stopGameTimer(gameId)`: Stop a timer
- `handleRoundTimeUp(gameId, roundId)`: Handle timer expiration
- `handleGetTimerState(client, data)`: Respond to client requests for timer state

### 2. Client-Side TypeScript Interfaces

Added in `game.service.ts`:

```typescript
// Timer update interface
export interface TimerUpdate {
  gameId: string;
  roundId: string;
  timeRemaining: number;
  roundDuration: number;
}
```

### 3. Client-Side Event Handlers

Added to `game-provider.tsx`:

```typescript
// Handle timer updates from the server
gameService.onTimerUpdate((timerData) => {
  console.log("Timer update from server:", timerData);

  // Verify that the timer update is for the current round
  if (!currentRound || currentRound.id !== timerData.roundId) {
    console.log("Timer update for different round, ignoring");
    return;
  }

  // Update round duration if it changed
  if (timerData.roundDuration !== roundDuration) {
    console.log("Updating round duration:", timerData.roundDuration);
    setRoundDuration(timerData.roundDuration);
  }

  // Update the time remaining
  setRoundTimeRemaining(timerData.timeRemaining);
});
```

### 4. Fallback Mechanism

Added in `drawing-room-template.tsx`:

```typescript
// Request timer state when needed as a fallback
const requestTimerState = useCallback(async () => {
  // ... check conditions ...
  try {
    const timerState = await gameService.requestTimerState(
      gameState.id,
      currentRound.id,
    );
    // ... update local timer if needed ...
  } catch (error) {
    console.error("Failed to request timer state:", error);
  }
}, [gameState, currentRound, timeLeft, roundTimeRemaining]);

// Setup polling fallback for timer if needed
useEffect(() => {
  // ... setup interval to call requestTimerState every 5 seconds ...
}, [currentRound?.status, gameState?.id, currentRound?.id, requestTimerState]);
```

### 5. Modified Timer Display Logic

Updated in `drawing-room-template.tsx`:

```typescript
// Update time left from server time
useEffect(() => {
  // If we have a server time, use it
  if (roundTimeRemaining !== null) {
    console.log("Setting timeLeft from server:", roundTimeRemaining);
    setTimeLeft(roundTimeRemaining);
  } else if (currentRound?.status === "WAITING") {
    // Reset timer if round is waiting
    setTimeLeft(roundDuration);
  }
}, [roundTimeRemaining, currentRound?.status, roundDuration]);
```

## Implementation Notes

1. The server sends timer updates approximately once per second
2. Clients request timer updates directly if they haven't received updates for 5 seconds
3. When a round ends, the timer is properly reset on the server
4. Correct guesses will notify the server to end the round
5. All players will see synchronized timers regardless of network conditions

## Conclusion

These changes create a more robust, consistent gameplay experience by centralizing the timer logic on the server and making clients display the server's authoritative timer state. If a client has connection issues, the fallback mechanism will help ensure their timer stays reasonably synchronized.

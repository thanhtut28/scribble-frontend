"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSocket } from "@/lib/providers/socket-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Define the form schema
const createRoomSchema = z
  .object({
    name: z.string().min(3, "Room name must be at least 3 characters"),
    maxPlayers: z.coerce.number().min(2).max(8),
    rounds: z.coerce.number().min(1).max(10),
    isPrivate: z.boolean().default(false),
    password: z.string().optional(),
  })
  .refine(
    (data) => {
      // If the room is private, password must be provided
      if (data.isPrivate && (!data.password || data.password.length < 3)) {
        return false;
      }
      return true;
    },
    {
      message: "Password must be at least 3 characters for private rooms",
      path: ["password"],
    },
  );

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;

export default function CreateRoomPage() {
  const { createRoom, isConnected, connecting } = useSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Default form values
  const defaultValues: Partial<CreateRoomFormValues> = {
    name: "",
    maxPlayers: 8,
    rounds: 8,
    isPrivate: false,
    password: "",
  };

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues,
  });

  const isPrivate = form.watch("isPrivate");

  // Form submission
  const onSubmit = async (values: CreateRoomFormValues) => {
    if (!isConnected) {
      toast.error("Not connected to game server. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const room = await createRoom(values.name, {
        maxPlayers: values.maxPlayers,
        rounds: values.rounds,
        isPrivate: values.isPrivate,
        password: values.isPrivate ? values.password : undefined,
      });
      toast.success("Room created successfully!");
      router.push(`/room/${room.id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (connecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p>Connecting to game server...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto flex h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Connection Error</h2>
          <p className="text-muted-foreground mb-4">
            Failed to connect to game server. Please check your connection and
            try again.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/">Go Back</Link>
            </Button>
            <Button onClick={() => window.location.reload()}>Reconnect</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Rooms
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a New Room</CardTitle>
            <CardDescription>Set up your game room settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Room Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter room name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be displayed to other players.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Players */}
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Players</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select max players" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} players
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The maximum number of players allowed in the room.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Number of Rounds */}
                <FormField
                  control={form.control}
                  name="rounds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rounds</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of rounds" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? "round" : "rounds"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How many rounds to play before the game ends.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Private Room */}
                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Private Room
                        </FormLabel>
                        <FormDescription>
                          Require a password to join this room.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Password (only if private) */}
                {isPrivate && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter room password"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Players will need this password to join.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Room"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

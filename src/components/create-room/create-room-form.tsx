"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateRoomValues, createRoomSchema } from "@/schema/create-room";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  Users,
  Clock,
  Lightbulb,
  Pencil,
  Target,
  WholeWord,
  Lock,
  File,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { socketService, SocketError } from "@/lib/services/socket.service";

const CreateRoomForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { handleAuthError } = useAuth();

  const form = useForm<CreateRoomValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      maxPlayers: 8,
      isPrivate: false,
      name: "",
      rounds: 2,
    },
  });

  async function onSubmit(values: CreateRoomValues) {
    try {
      setIsLoading(true);
      setError(null);

      // Make sure we have a socket connection
      if (!socketService.isConnected()) {
        try {
          await socketService.connect();
        } catch (connectError) {
          // Check if it's an auth error
          if (
            connectError instanceof Error &&
            (connectError.message.includes("expired") ||
              connectError.message.includes("auth") ||
              connectError.message.includes("token"))
          ) {
            // Handle as auth error
            handleAuthError({
              code: "AUTH_FAILED",
              message: connectError.message,
              redirectTo: "/login",
            });
            return;
          } else {
            throw connectError;
          }
        }
      }

      // Send create room request
      const room = await socketService.createRoom({
        name: values.name,
        maxPlayers: values.maxPlayers,
        rounds: values.rounds,
        isPrivate: values.isPrivate,
        password: values.password,
      });

      // Show success message in console
      console.log(`Room created: ${room.name}`);

      // Navigate to the room
      router.push(`/join-room`);
    } catch (error) {
      console.error("Failed to create room:", error);

      // Handle the error based on its properties
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create room";
      setError(errorMessage);

      // Check if the error should be treated as an auth error
      if (
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("token")
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: errorMessage,
          redirectTo: "/login",
        });
      } else {
        // Show generic error alert for non-auth errors
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const generateSelectItems = (start: number, end: number, step = 1) =>
    Array.from({ length: Math.floor((end - start) / step + 1) }, (_, i) => (
      <SelectItem key={i} value={(start + i * step).toString()}>
        {start + i * step}
      </SelectItem>
    ));

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Decorative elements */}
      <div className="absolute -top-6 -left-6 h-12 w-12 rounded-full bg-yellow-400 opacity-80"></div>
      <div className="absolute -right-4 -bottom-4 h-10 w-10 rounded-full bg-blue-500 opacity-70"></div>
      <div className="absolute top-1/4 -right-8 h-8 w-8 rounded-full bg-red-500 opacity-70"></div>
      <div className="absolute bottom-1/3 -left-10 h-14 w-14 rounded-full bg-green-500 opacity-60"></div>

      <Card className="relative w-full overflow-hidden border-4 border-dashed border-amber-500 bg-[#fffdf7] shadow-lg">
        <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-red-100 opacity-50"></div>
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-blue-100 opacity-50"></div>

        <CardHeader className="border-b-2 border-dashed border-amber-300 bg-[#f8f4e8] pb-4">
          <div className="mb-2 flex items-center justify-center">
            <Pencil className="mr-2 h-8 w-8 text-amber-600" />
            <CardTitle className="font-comic text-2xl font-bold text-amber-800">
              Create Drawing Room
            </CardTitle>
          </div>
          <CardDescription className="text-center text-amber-700">
            Set up your playground
          </CardDescription>
        </CardHeader>

        <CardContent className="relative pt-4">
          {error && (
            <div className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Room Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <File className="h-4 w-4 text-amber-600" />
                        Room Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="border-amber-300 bg-white"
                          placeholder="Enter room name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Players */}
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Users className="h-4 w-4 text-amber-600" />
                        Players
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          defaultValue={field.value?.toString()}
                        >
                          <SelectTrigger className="border-amber-300 bg-white">
                            <SelectValue placeholder="Select number of players" />
                          </SelectTrigger>
                          <SelectContent title="Choose number of players">
                            {generateSelectItems(1, 10)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rounds */}
                <FormField
                  control={form.control}
                  name="rounds"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Target className="h-4 w-4 text-amber-600" />
                        Rounds
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          defaultValue={field.value?.toString()}
                        >
                          <SelectTrigger className="border-amber-300 bg-white">
                            <SelectValue placeholder="Select number of rounds" />
                          </SelectTrigger>
                          <SelectContent title="Number of drawing rounds">
                            {generateSelectItems(1, 8)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Private */}
                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Lock className="h-4 w-4 text-amber-600" />
                        Private Room
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm text-amber-700">
                            {field.value ? "Private" : "Public"}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password (conditional) */}
                {form.watch("isPrivate") && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                        <FormLabel className="flex items-center gap-2 text-amber-800">
                          <Lock className="h-4 w-4 text-amber-600" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="border-amber-300 bg-white"
                            placeholder="Enter room password"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full border-2 border-amber-600 bg-amber-500 px-8 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg md:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex items-center justify-center border-t-2 border-dashed border-amber-300 py-3 text-center text-xs text-amber-700">
          <p>Ready, set, draw! Share the room link and start sketching!</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateRoomForm;

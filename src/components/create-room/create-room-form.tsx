"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type GameSettings, gameSettingsSchema } from "@/schema/create-room";
import {
  Users,
  Clock,
  Lightbulb,
  Pencil,
  Target,
  WholeWord,
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

const CreateRoomForm = () => {
  const form = useForm<GameSettings>({
    resolver: zodResolver(gameSettingsSchema),
    defaultValues: {
      players: 8,
      drawTime: 80,
      rounds: 3,
      wordCount: 3,
      hints: 2,
    },
  });

  function onSubmit(values: GameSettings) {
    console.log(values);
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Players */}
                <FormField
                  control={form.control}
                  name="players"
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
                          <SelectContent title="Choose number of artists">
                            {generateSelectItems(1, 10)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Draw Time */}
                <FormField
                  control={form.control}
                  name="drawTime"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Clock className="h-4 w-4 text-amber-600" />
                        Sketch Time
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          defaultValue={field.value?.toString()}
                        >
                          <SelectTrigger className="border-amber-300 bg-white">
                            <SelectValue placeholder="Select draw time" />
                          </SelectTrigger>
                          <SelectContent title="Set your drawing time">
                            {generateSelectItems(20, 240, 20)}
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
                            {generateSelectItems(2, 10)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Word Count */}
                <FormField
                  control={form.control}
                  name="wordCount"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <WholeWord className="h-4 w-4 text-amber-600" />
                        Word Count
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          defaultValue={field.value?.toString()}
                        >
                          <SelectTrigger className="border-amber-300 bg-white">
                            <SelectValue placeholder="Select word count" />
                          </SelectTrigger>
                          <SelectContent title="Number of drawing subjects">
                            {generateSelectItems(1, 5)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hints */}
                <FormField
                  control={form.control}
                  name="hints"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        Hints
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          defaultValue={field.value?.toString()}
                        >
                          <SelectTrigger className="border-amber-300 bg-white">
                            <SelectValue placeholder="Select hints" />
                          </SelectTrigger>
                          <SelectContent title="Available inspiration clues">
                            {generateSelectItems(0, 5)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full border-2 border-amber-600 bg-amber-500 px-8 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg md:w-auto"
                >
                  Create Room
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

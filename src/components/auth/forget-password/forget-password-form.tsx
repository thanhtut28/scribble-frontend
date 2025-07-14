"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const forgetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgetPasswordSchemaType = z.infer<typeof forgetPasswordSchema>;

const ForgetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgetPasswordSchemaType>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgetPasswordSchemaType) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Forget password data:", data);
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

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
            <KeyRound className="mr-2 h-8 w-8 text-amber-600" />
            <CardTitle className="text-2xl font-bold text-amber-800">
              Forgot Your Password?
            </CardTitle>
          </div>
          <CardDescription className="text-center text-amber-700">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        <CardContent className="relative pt-6">
          {!isSubmitted ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Mail className="h-4 w-4 text-amber-600" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your email address"
                          className={cn(
                            "border-amber-300 bg-white text-base placeholder:text-amber-300",
                            fieldState.invalid && "border-red-400",
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-sm font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="mt-6 flex justify-center">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full border-2 border-amber-600 bg-amber-500 px-8 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Sending link...</span>
                      </div>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="mb-2 text-lg font-medium text-amber-800">
                  Check Your Email
                </h3>
                <p className="text-amber-700">
                  We&apos;ve sent a password reset link to your email address.
                  Please check your inbox.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-center border-t-2 border-dashed border-amber-300 py-3 text-center text-sm text-amber-700">
          <p>
            <Link
              href="/login"
              className="font-medium text-amber-600 underline hover:text-amber-800"
            >
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgetPasswordForm;

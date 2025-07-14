"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PasswordCriteria from "../password-criteria";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: ResetPasswordSchema) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Reset password data:", data);
      router.push("/reset-password/success");
      setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "password") {
        setPassword(value.password || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
              Create New Password
            </CardTitle>
          </div>
          <CardDescription className="text-center text-amber-700">
            Reset your password and secure your account
          </CardDescription>
        </CardHeader>

        <CardContent className="relative pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Lock className="h-4 w-4 text-amber-600" />
                        New Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a new password"
                            onFocus={() => setShowCriteria(true)}
                            className={cn(
                              "border-amber-300 bg-white text-base placeholder:text-amber-300",
                              fieldState.invalid && "border-red-400",
                            )}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                      <FormMessage className="text-sm font-medium text-red-500" />
                      {(showCriteria || password.length > 0) && (
                        <PasswordCriteria password={password} />
                      )}
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Lock className="h-4 w-4 text-amber-600" />
                        Confirm Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className={cn(
                              "border-amber-300 bg-white text-base placeholder:text-amber-300",
                              fieldState.invalid && "border-red-400",
                            )}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword
                              ? "Hide password"
                              : "Show password"}
                          </span>
                        </Button>
                      </div>
                      <FormMessage className="text-sm font-medium text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

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
                      <span>Resetting password...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex items-center justify-center border-t-2 border-dashed border-amber-300 py-3 text-center text-sm text-amber-700">
          <p>
            Remember your password?{" "}
            <a
              href="/login"
              className="font-medium text-amber-600 underline hover:text-amber-800"
            >
              Back to login
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

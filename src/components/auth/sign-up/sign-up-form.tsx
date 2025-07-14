"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, Mail, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PasswordCriteria from "../password-criteria";
import { useAuth } from "@/lib/providers/auth-provider";
import { toast } from "sonner";

// Define schema directly in the component file for better readability
const signUpSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(3, "Password must be at least 3 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpSchemaType = z.infer<typeof signUpSchema>;

const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showCriteria, setShowCriteria] = useState(false);
  const { signup } = useAuth();

  const form = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handlePasswordToggle = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleConfirmPasswordToggle = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  const onSubmit = useCallback(
    async (formData: SignUpSchemaType) => {
      try {
        await signup.mutateAsync({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        });
        toast.success("Account created successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Registration failed",
        );
      }
    },
    [signup],
  );

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "password") {
        setPassword(value.password || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="relative mx-auto my-4 w-full max-w-md">
      {/* Decorative elements */}
      <div className="absolute -top-2 -left-7 h-12 w-12 rounded-full bg-yellow-400 opacity-80"></div>
      <div className="absolute -right-4 bottom-2 h-10 w-10 rounded-full bg-blue-500 opacity-70"></div>
      <div className="absolute top-1/4 -right-8 h-8 w-8 rounded-full bg-red-500 opacity-70"></div>
      <div className="absolute bottom-1/3 -left-10 h-14 w-14 rounded-full bg-green-500 opacity-60"></div>

      <Card className="relative w-full overflow-hidden border-4 border-dashed border-amber-500 bg-[#fffdf7] py-4 shadow-lg">
        <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-red-100 opacity-50"></div>
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-blue-100 opacity-50"></div>

        <CardHeader className="border-b-2 border-dashed border-amber-300 bg-[#f8f4e8] pb-4">
          <div className="mb-2 flex items-center justify-center">
            <UserCircle2 className="mr-2 h-8 w-8 text-amber-600" />
            <CardTitle className="text-2xl font-bold text-amber-800">
              Create Account
            </CardTitle>
          </div>
          <CardDescription className="text-center text-amber-700">
            Join our creative community
          </CardDescription>
        </CardHeader>

        <CardContent className="relative pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <UserCircle2 className="h-4 w-4 text-amber-600" />
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className={cn(
                            "border-amber-300 bg-white text-base placeholder:text-amber-300",
                            fieldState.invalid && "border-red-400",
                          )}
                          placeholder="Choose a username"
                        />
                      </FormControl>
                      <FormMessage className="text-sm font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
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
                          className={cn(
                            "border-amber-300 bg-white text-base placeholder:text-amber-300",
                            fieldState.invalid && "border-red-400",
                          )}
                          placeholder="Enter your email"
                        />
                      </FormControl>
                      <FormMessage className="text-sm font-medium text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Lock className="h-4 w-4 text-amber-600" />
                        Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
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
                          onClick={handlePasswordToggle}
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
                            placeholder="Confirm your password"
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
                          onClick={handleConfirmPasswordToggle}
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
                  disabled={signup.isPending}
                >
                  {signup.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex items-center justify-center border-t-2 border-dashed border-amber-300 py-3 text-center text-sm text-amber-700">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-amber-600 underline hover:text-amber-800"
            >
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpForm;

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
import { useState, useCallback } from "react";
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
import { useAuthContext } from "@/lib/providers/auth-provider";
import { toast } from "sonner";

// Define schema directly in the component file for better readability
const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(3, "Password must be at least 3 characters"),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthContext();

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const handlePasswordToggle = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const onSubmit = useCallback(
    async (formData: LoginSchemaType) => {
      try {
        await login.mutateAsync({
          usernameOrEmail: formData.identifier,
          password: formData.password,
        });
        toast.success("Login successful!");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Login failed");
      }
    },
    [login],
  );

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
            <UserCircle2 className="mr-2 h-8 w-8 text-amber-600" />
            <CardTitle className="text-2xl font-bold text-amber-800">
              Welcome Back!
            </CardTitle>
          </div>
          <CardDescription className="text-center text-amber-700">
            Login to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="relative pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                {/* Email or Username Field */}
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field, fieldState }) => (
                    <FormItem className="rounded-lg border border-amber-200 bg-white/80 p-3">
                      <FormLabel className="flex items-center gap-2 text-amber-800">
                        <Mail className="h-4 w-4 text-amber-600" />
                        Email or Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className={cn(
                            "border-amber-300 bg-white text-base placeholder:text-amber-300",
                            fieldState.invalid && "border-red-400",
                          )}
                          placeholder="Enter your email or username"
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
                            placeholder="Enter your password"
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
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-amber-600 hover:text-amber-800"
                    type="button"
                    asChild
                  >
                    <Link href="/forget-password">Trouble logging in?</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full border-2 border-amber-600 bg-amber-500 px-8 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex items-center justify-center border-t-2 border-dashed border-amber-300 py-3 text-center text-sm text-amber-700">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-amber-600 underline hover:text-amber-800"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginForm;

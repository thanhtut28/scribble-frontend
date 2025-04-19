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
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import Link from "next/link";

import {
  loginSchema,
  LoginSchemaType,
} from "@/schema/form-schemas/login-schema";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handlePasswordToggle = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  //   const { mutate: loginMutation } = useLoginMutation({
  //     onSuccess: (authResponse) => {
  //       setIsLoading(false);
  //       toast({
  //         variant: "success",
  //         title: "Logged In successfully",
  //         description: "You have been logged in successfully",
  //       });
  //       TokenService.setAccessToken(authResponse.tokens.accessToken);
  //       router.push("/");
  //     },
  //     onError: () => {
  //       setIsLoading(false);
  //     },
  //   });

  //   const onSubmit = useCallback(
  //     (formData: LoginSchemaType) => {
  //       setIsLoading(true);
  //       loginMutation({
  //         email: formData.email,
  //         password: formData.password,
  //         name: "placeholder",
  //       });
  //     },
  //     [loginMutation],
  //   );

  const onSubmit = (formData: LoginSchemaType) => {
    setIsLoading(true);
    console.log("LOGIN formdata", formData);
  };

  return (
    <div className="w-full max-w-md px-4 md:px-0">
      <div className="mb-6 flex w-full flex-col items-center gap-2">
        <h2 className="text-retroBlueDark text-3xl font-bold md:text-4xl">
          Welcome Back!
        </h2>
        <p className="text-center text-sm font-medium text-gray-400 md:text-base">
          Login to your admin account
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4 md:space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-2 md:space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600 md:text-sm">
                    Email
                  </FormLabel>
                  <div className="relative">
                    <Mail className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2 md:size-5" />
                    <FormControl>
                      <Input
                        {...field}
                        className={cn(
                          "h-10 pl-12 text-sm leading-[1] placeholder:text-xs md:h-12 md:text-base md:placeholder:text-sm dark:bg-white dark:text-slate-900 dark:ring-offset-white",
                          fieldState.invalid &&
                            "border-2 border-rose-500 focus-visible:ring-0",
                        )}
                        placeholder="Enter your email"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-xs font-medium" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600 md:text-sm">
                    Password
                  </FormLabel>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2 md:size-5" />
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={cn(
                          "h-10 pl-12 text-sm leading-[1] placeholder:text-xs md:h-12 md:text-base md:placeholder:text-sm dark:bg-white dark:text-slate-900 dark:ring-offset-white",
                          fieldState.invalid &&
                            "border-2 border-rose-500 focus-visible:ring-0",
                        )}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={handlePasswordToggle}
                    >
                      {showPassword ? (
                        <EyeOff className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <Eye className="text-muted-foreground h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  <FormMessage className="text-xs font-medium" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex w-full flex-col items-center gap-3 md:gap-2">
            <Button
              variant="link"
              className="text-muted-foreground flex h-auto w-full justify-start p-0 text-xs"
              type="button"
            >
              <Link href="/forget-password" prefetch={true}>
                Trouble logging in?
              </Link>
            </Button>
            <Button
              type="submit"
              className="bg-retroBlueDark hover:bg-retroBlueDark/90 relative h-10 w-full text-sm md:h-12 md:text-base dark:text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              ) : (
                "Login"
              )}
            </Button>
            <Button
              asChild
              variant="link"
              className="text-muted-foreground -mt-2 w-full text-center text-xs md:text-sm"
            >
              <Link href="/signup" prefetch={true}>
                Don&apos;t have an account? Sign up
              </Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffbf0] p-4">
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
              <CheckCircle2 className="mr-2 h-8 w-8 text-green-500" />
              <CardTitle className="text-2xl font-bold text-amber-800">
                Password Reset Success!
              </CardTitle>
            </div>
            <CardDescription className="text-center text-amber-700">
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center gap-6 p-8">
            <div className="text-center text-amber-700">
              <p className="mb-2">
                Your account is now secure with your new password.
              </p>
              <p>
                You can now use your new password to log in to your account.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="rounded-full border-2 border-amber-600 bg-amber-500 px-8 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
            >
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

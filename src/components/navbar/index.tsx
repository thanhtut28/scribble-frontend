"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileMenu from "./profile-menu";
import { userService } from "@/lib/services/user.service";
import { useQuery } from "@tanstack/react-query";

const Navbar = () => {
  const { isAuthenticated, isLoadingUser } = useAuth();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => userService.getMe(),
    enabled: isAuthenticated,
  });

  const getInitial = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="supports-[backdrop-filter]:bg-background/60 backdrop-blurs sticky top-0 z-50 w-full border-b bg-amber-200">
      <div className="flex h-14 w-full items-center bg-amber-100 px-6">
        <div className="flex flex-1 items-center justify-between">
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link href="/" className="text-2xl font-semibold text-amber-700">
              Dootell
            </Link>
          </nav>
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-amber-700 text-amber-200">
                    {getInitial(user.username)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <ProfileMenu username={user.username} email={user.email} />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

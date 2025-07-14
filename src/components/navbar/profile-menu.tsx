"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/lib/types/auth";
import { userService } from "@/lib/services/user.service";
import { UpdatePasswordDto, UpdateUserDto } from "@/lib/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/providers/auth-provider";
import { toast } from "sonner";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ProfileMenuProps {
  username: string;
  email: string;
}

const ProfileMenu = ({ username, email }: ProfileMenuProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userData, setUserData] = useState<UpdateUserDto>({
    username: username,
    email: email,
  });
  const [passwordData, setPasswordData] = useState<UpdatePasswordDto>({
    oldPassword: "",
    newPassword: "",
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => userService.updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: UpdatePasswordDto) => userService.updatePassword(data),
    onSuccess: () => {
      toast.success("Password updated successfully");
      setIsChangingPassword(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update password");
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(userData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePasswordMutation.mutate(passwordData);
  };

  if (isEditingProfile) {
    return (
      <div className="p-2">
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <h3 className="text-sm font-medium">Edit Profile</h3>
          <div className="space-y-2">
            <Input
              placeholder="Username"
              value={userData.username || ""}
              onChange={(e) =>
                setUserData({ ...userData, username: e.target.value })
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={userData.email || ""}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (isChangingPassword) {
    return (
      <div className="p-2">
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <h3 className="text-sm font-medium">Change Password</h3>
          <div className="space-y-2">
            <Input
              placeholder="Current Password"
              type="password"
              value={passwordData.oldPassword || ""}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  oldPassword: e.target.value,
                })
              }
            />
            <Input
              placeholder="New Password"
              type="password"
              value={passwordData.newPassword || ""}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-4">
      <DropdownMenuLabel>
        <div className="space-y-1">
          <p className="text-sm font-medium">Signed in as</p>
          <p className="text-sm font-bold">{username}</p>
          <p className="text-muted-foreground text-xs">{email}</p>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />
      <Button
        variant={"ghost"}
        className="w-full justify-start"
        onClick={() => setIsEditingProfile(true)}
      >
        Edit Profile
      </Button>
      <Button
        variant={"ghost"}
        className="w-full justify-start"
        onClick={() => setIsChangingPassword(true)}
      >
        Change Password
      </Button>

      <DropdownMenuSeparator />
      <Button
        variant={"ghost"}
        className="focus:text-destructive w-full justify-start bg-red-500 text-red-100 hover:bg-red-600 hover:text-red-100"
        onClick={logout}
      >
        Logout
      </Button>
    </div>
  );
};

export default ProfileMenu;

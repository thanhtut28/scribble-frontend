import apiClient from "../axios";
import {
  UpdatePasswordDto,
  UpdateUserDto,
  UserResponseDto,
} from "../types/user";

export const userService = {
  getMe: async (): Promise<UserResponseDto> => {
    const response = await apiClient.get<UserResponseDto>("/users/me");
    return response.data;
  },

  updateUser: async (data: UpdateUserDto): Promise<UserResponseDto> => {
    const response = await apiClient.patch<UserResponseDto>(
      "/users/update-user",
      data,
    );
    return response.data;
  },

  updatePassword: async (data: UpdatePasswordDto): Promise<UserResponseDto> => {
    const response = await apiClient.patch<UserResponseDto>(
      "/users/update-password",
      data,
    );
    return response.data;
  },
};

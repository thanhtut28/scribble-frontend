export interface UpdateUserDto {
  email?: string;
  username?: string;
}

export interface UpdatePasswordDto {
  oldPassword?: string;
  newPassword?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  createdAt: Date;
}

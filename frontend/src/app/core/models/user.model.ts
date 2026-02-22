export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profilePicture?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  preferences: {
    currency: string;
    dateFormat: string;
    theme: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

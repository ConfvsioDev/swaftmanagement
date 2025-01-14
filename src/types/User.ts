// src/types/User.ts
export interface User {
    id: string;
    email?: string;
    user_metadata: {
      avatar_url?: string; // Ensure this is included
      full_name?: string; // Full name of the user
    };
    nickname?: string; // User's chosen nickname
  }
  
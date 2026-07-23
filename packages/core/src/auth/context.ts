import { createContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import type { Database } from "../database.types";
import type { SiteSlug } from "../site-registry";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];

export type AuthProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "role" | "status" | "full_name" | "default_resume_path"
>;

export type SignUpRole = Exclude<UserRole, "admin">;

export type SignUpOptions = {
  readonly role: SignUpRole;
  readonly siteSlug: SiteSlug;
  readonly fullName: string;
};

export type SignUpResult =
  | {
      readonly state: "signed_in";
      readonly session: Session;
      readonly user: User;
    }
  | {
      readonly state: "confirmation_required";
      readonly session: null;
      readonly user: User | null;
    };

export type AuthContextValue = {
  readonly session: Session | null;
  readonly user: User | null;
  readonly profile: AuthProfile | null;
  readonly role: UserRole | null;
  readonly status: UserStatus | null;
  readonly loading: boolean;
  readonly initialized: boolean;
  readonly signUp: (
    email: string,
    password: string,
    options: SignUpOptions,
  ) => Promise<SignUpResult>;
  readonly signIn: (email: string, password: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly refreshProfile: () => Promise<void>;
};

export type AuthProviderProps = {
  readonly children: ReactNode;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

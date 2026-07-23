import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient } from "../client";
import type { Database } from "../database.types";
import { getRedirectUrl } from "../redirect";
import {
  AuthContext,
  type AuthProfile,
  type AuthProviderProps,
  type SignUpOptions,
  type SignUpResult,
} from "./context";

const PROFILE_COLUMNS =
  "id, role, status, full_name, default_resume_path" as const;

function toUserFacingError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error("Something went wrong. Please try again.", { cause: error });
}

async function fetchProfile(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<AuthProfile> {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const client = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    let authRevision = 0;
    let unsubscribe: (() => void) | undefined;

    const resolveSession = async (nextSession: Session | null) => {
      const revision = ++authRevision;

      if (active) {
        setLoading(true);
        setSession(nextSession);
      }

      try {
        const nextProfile = nextSession
          ? await fetchProfile(client, nextSession.user.id)
          : null;

        if (active && revision === authRevision) {
          setProfile(nextProfile);
        }
      } catch (error) {
        if (active && revision === authRevision) {
          setProfile(null);
        }

        console.error("Failed to load the authenticated profile", error);
      } finally {
        if (active && revision === authRevision) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    const initialize = async () => {
      const { data, error } = await client.auth.getSession();

      if (error) {
        if (active) {
          setSession(null);
          setProfile(null);
          setInitialized(true);
          setLoading(false);
        }

        console.error("Failed to initialize authentication", error);
      } else {
        await resolveSession(data.session);
      }

      if (!active) {
        return;
      }

      const { data: listener } = client.auth.onAuthStateChange(
        (_event, nextSession) => {
          void resolveSession(nextSession);
        },
      );

      unsubscribe = () => listener.subscription.unsubscribe();
    };

    void initialize();

    return () => {
      active = false;
      ++authRevision;
      unsubscribe?.();
    };
  }, [client]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options: SignUpOptions,
    ): Promise<SignUpResult> => {
      setLoading(true);

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: options.role,
            site: options.siteSlug,
            full_name: options.fullName,
          },
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        setLoading(false);
        throw toUserFacingError(error);
      }

      if (!data.session) {
        setSession(null);
        setProfile(null);
        setInitialized(true);
        setLoading(false);

        return {
          state: "confirmation_required",
          session: null,
          user: data.user,
        };
      }

      return {
        state: "signed_in",
        session: data.session,
        user: data.session.user,
      };
    },
    [client],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);

      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        throw toUserFacingError(error);
      }
    },
    [client],
  );

  const signOut = useCallback(async (): Promise<void> => {
    setSession(null);
    setProfile(null);
    setLoading(true);

    const { error } = await client.auth.signOut();

    if (error) {
      setInitialized(true);
      setLoading(false);
      throw toUserFacingError(error);
    }

    setInitialized(true);
    setLoading(false);
  }, [client]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!session) {
      setProfile(null);
      return;
    }

    setLoading(true);

    try {
      const nextProfile = await fetchProfile(client, session.user.id);
      const { data, error } = await client.auth.getSession();

      if (error) {
        throw error;
      }

      if (data.session?.user.id === session.user.id) {
        setProfile(nextProfile);
      }
    } catch (error) {
      throw toUserFacingError(error);
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, [client, session]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      status: profile?.status ?? null,
      loading,
      initialized,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      initialized,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    ],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

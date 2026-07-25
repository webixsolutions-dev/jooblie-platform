import { useState } from "react";
import { useAuth } from "@jooblie/core";
import { useNavigate } from "react-router-dom";

export function useAdminSignOut() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);

    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (caughtError) {
      setSignOutError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign out. Please try again.",
      );
      setIsSigningOut(false);
    }
  };

  return {
    handleSignOut,
    isSigningOut,
    signOutError,
  };
}

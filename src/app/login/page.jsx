"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// ✅ Inner component that uses useSearchParams
function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  useEffect(() => {
    if (searchParams.get("error") === "AccessDenied") {
      setError("This Gmail is not authorized. Only the admin can login.");
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    await signIn("google", { callbackUrl });
    setLoading(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary-main)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-s16"
      style={{ background: "linear-gradient(135deg, var(--primary-main), var(--primary-light))" }}
    >
      <div className="bg-background rounded-r32 p-s40 w-full max-w-sm shadow-2xl">
        {/* Brand */}
        <div className="text-center mb-s32">
          <div
            className="w-16 h-16 rounded-r16 flex items-center justify-center mx-auto mb-s16"
            style={{ background: "var(--primary-main)" }}
          >
            <span style={{ color: "white", fontSize: "1.5rem", fontWeight: "bold" }}>R</span>
          </div>
          <h1 className="heading-h4 text-main">Rantraa Admin</h1>
          <p className="body-small text-secondary mt-s8">Sign in to continue</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-s24 p-s16 rounded-r16 border"
            style={{
              background: "rgba(192,55,55,0.1)",
              borderColor: "var(--red-main)",
            }}
          >
            <p className="body-small" style={{ color: "var(--red-dark)" }}>
              ❌ {error}
            </p>
          </div>
        )}

        {/* Google Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-s16 py-s16 px-s24 rounded-r16 border-2 transition-all disabled:opacity-50"
          style={{ borderColor: "var(--secondary-dark)" }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.background = "var(--secondary-main)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          {loading ? (
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary-main)", borderTopColor: "transparent" }}
            />
          ) : (
            <>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="body-default font-medium text-main">
                Sign in with Google
              </span>
            </>
          )}
        </button>

        <p className="caption text-secondary text-center mt-s24">
          🔒 Admin access only
        </p>
      </div>
    </div>
  );
}

// ✅ Fallback shown while Suspense resolves (during prerender/CSR bailout)
function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div
        className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: "var(--primary-main)", borderTopColor: "transparent" }}
      />
    </div>
  );
}

// ✅ Default export wraps everything in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary-main)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div
        className="py-s80 px-s24"
        style={{
          background: "linear-gradient(135deg, var(--primary-main), var(--primary-light))",
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="heading-h1 mb-s16" style={{ color: "white" }}>
            Welcome to Rantraa
          </h1>
          <p className="body-large mb-s32" style={{ color: "rgba(255,255,255,0.9)" }}>
            Book Pooja & Consult Spiritual Experts
          </p>

          {!session && (
            <Link
              href="/login"
              className="inline-block px-s32 py-s16 body-default font-medium rounded-r16 transition-all"
              style={{ background: "var(--accent-main)", color: "white" }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Sign In Now
            </Link>
          )}
        </div>
      </div>

      {/* User Welcome Section */}
      {session && (
        <div className="max-w-7xl mx-auto px-s24 py-s64">
          <div
            className="rounded-r24 p-s40 border"
            style={{
              background: "white",
              borderColor: "var(--secondary-dark)",
            }}
          >
            <div className="flex flex-col items-center text-center gap-s24">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user?.name}
                  className="w-24 h-24 rounded-r16"
                />
              )}
              <div>
                <h2 className="heading-h2 text-main mb-s8">
                  Welcome back, {session.user?.name?.split(" ")[0]}! 👋
                </h2>
                <p className="body-default text-secondary mb-s24">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

   

      {/* CTA Section */}
      {!session && (
        <div
          className="py-s64 px-s24"
          style={{ background: "var(--secondary-main)" }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="heading-h2 text-main mb-s24">Ready to get started?</h2>
            <Link
              href="/login"
              className="inline-block px-s40 py-s18 heading-h5 rounded-r16 transition-all"
              style={{ background: "var(--primary-main)", color: "white" }}
              onMouseEnter={(e) => (e.target.style.background = "var(--primary-light)")}
              onMouseLeave={(e) => (e.target.style.background = "var(--primary-main)")}
            >
              Sign In with Google
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="py-s32 px-s24 border-t"
        style={{ borderColor: "var(--secondary-dark)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-s16">
            <div className="flex items-center gap-s12">
              <div
                className="w-8 h-8 rounded-r8 flex items-center justify-center"
                style={{ background: "var(--primary-main)" }}
              >
                <span style={{ color: "white", fontWeight: "bold", fontSize: "0.875rem" }}>R</span>
              </div>
              <span className="heading-h6 text-main">Rantraa</span>
            </div>
            <p className="body-small text-secondary">
              © 2024 Rantraa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


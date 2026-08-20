"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function NavBar() {
  const { data: session, status } = useSession();
  console.log("data",session)
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  return (
    <nav
      className="sticky top-0 z-50 bg-background border-b"
      style={{ borderColor: "var(--secondary-dark)" }}
    >
      <div className="max-w-7xl mx-auto px-s24 py-s16">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-s16">
            <div
              className="w-10 h-10 rounded-r16 flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-main)" }}
            >
              <span style={{ color: "white", fontWeight: "bold", fontSize: "1rem" }}>
                R
              </span>
            </div>
            <span className="heading-h5 text-main hidden sm:inline">Rantraa</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-s64">
            {/* Online Pooja */}
            <Link
              href="/poojas/online"
              className="body-default transition-colors relative"
              style={{
                color: isActive("/poojas/online")
                  ? "var(--primary-main)"
                  : "var(--text-main)",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/poojas/online"))
                  e.target.style.color = "var(--primary-main)";
              }}
              onMouseLeave={(e) => {
                if (!isActive("/poojas/online"))
                  e.target.style.color = "var(--text-main)";
              }}
            >
              🎥 Online Poojas
              {isActive("/poojas/online") && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "var(--primary-main)",
                    borderRadius: "var(--R8)",
                  }}
                />
              )}
            </Link>

            {/* Offline Pooja */}
            <Link
              href="/poojas/offline"
              className="body-default transition-colors relative"
              style={{
                color: isActive("/poojas/offline")
                  ? "var(--primary-main)"
                  : "var(--text-main)",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/poojas/offline"))
                  e.target.style.color = "var(--primary-main)";
              }}
              onMouseLeave={(e) => {
                if (!isActive("/poojas/offline"))
                  e.target.style.color = "var(--text-main)";
              }}
            >
              🕉️ Offline Poojas
              {isActive("/poojas/offline") && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "var(--primary-main)",
                    borderRadius: "var(--R8)",
                  }}
                />
              )}
            </Link>
            <Link
              href="/products"
              className="body-default transition-colors relative"
              style={{
                color: isActive("/products")
                  ? "var(--primary-main)"
                  : "var(--text-main)",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/products"))
                  e.target.style.color = "var(--primary-main)";
              }}
              onMouseLeave={(e) => {
                if (!isActive("/products"))
                  e.target.style.color = "var(--text-main)";
              }}
            >
              Products
              {isActive("/products") && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "var(--primary-main)",
                    borderRadius: "var(--R8)",
                  }}
                />
              )}
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-s16">
            {status === "loading" ? (
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: "var(--primary-main)",
                  borderTopColor: "transparent",
                }}
              />
            ) : session ? (
              <>
                <div className="hidden sm:flex items-center gap-s16">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name}
                      width={200}
                      height={100}
                      className="w-8 h-8 rounded-r8 object-cover"
                    />
                  )}
                  <div className="hidden lg:block">
                    <p className="body-small font-medium text-main">
                      {session.user?.name}
                    </p>
                    <p className="caption text-secondary">{session.user?.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-s8 rounded-r8 transition-all hover:bg-red-light/10"
                  style={{ color: "var(--red-main)" }}
                  title="Sign Out"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
                    <polyline points="17 16 21 12 17 8" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-s16 py-s8 body-small font-medium text-white rounded-r8 transition-all"
                style={{ background: "var(--primary-main)" }}
                onMouseEnter={(e) =>
                  (e.target.style.background = "var(--primary-light)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = "var(--primary-main)")
                }
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-s8 body-default"
              style={{ color: "var(--text-main)" }}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden mt-s16 pb-s16 pt-s16 space-y-s16"
            style={{ borderTop: `1px solid var(--secondary-dark)` }}
          >
            <Link
              href="/poojas/online"
              className="block body-default"
              style={{
                color: isActive("/poojas/online")
                  ? "var(--primary-main)"
                  : "var(--text-main)",
                fontWeight: isActive("/poojas/online") ? "600" : "400",
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              🎥 Online Poojas
            </Link>
            <Link
              href="/poojas/offline"
              className="block body-default"
              style={{
                color: isActive("/poojas/offline")
                  ? "var(--primary-main)"
                  : "var(--text-main)",
                fontWeight: isActive("/poojas/offline") ? "600" : "400",
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              🕉️ Offline Poojas
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
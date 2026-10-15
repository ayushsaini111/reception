// app/admin/page.jsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // adjust if using custom auth
import Link from "next/link";

const sections = [
  {
    title: "Calendar",
    description: "Manage pooja availability & time slots",
    href: "/admin/calendar",
    icon: "📅",
    color: "bg-blue-50 text-blue-700",
  },
  {
    title: "Pandits",
    description: "View earnings, talk time & manage accounts",
    href: "/admin/pandits",
    icon: "🧘",
    color: "bg-orange-50 text-orange-700",
  },
//   {
//     title: "Payouts",
//     description: "Review and process payout requests",
//     href: "/admin/payouts",
//     icon: "💰",
//     color: "bg-green-50 text-green-700",
//   },
  {
    title: "Poojas",
    description: "Manage pooja listings & content",
    href: "/admin/poojas",
    icon: "🪔",
    color: "bg-amber-50 text-amber-700",
  },
  {
    title: "Products",
    description: "Manage store products & categories",
    href: "/admin/products",
    icon: "🛍️",
    color: "bg-purple-50 text-purple-700",
  },
//   {
//     title: "Replies",
//     description: "Manage WhatsApp / message replies",
//     href: "/admin/replies",
//     icon: "💬",
//     color: "bg-pink-50 text-pink-700",
//   },
];

export default function AdminDashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="body-default text-secondary">Checking session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // redirecting
  }

  return (
    <div className="p-s24 md:p-s40 max-w-[1200px] mx-auto">
      <div className="mb-s32">
        <h1 className="heading-h3 text-main">Admin Dashboard</h1>
        <p className="body-small text-secondary">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""} 👋
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-s24">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-r24 border border-secondary-main p-s24 flex flex-col gap-s16 bg-background hover:border-primary-main hover:shadow-md transition-all"
          >
            <div
              className={`w-[48px] h-[48px] rounded-r16 flex items-center justify-center text-2xl ${section.color}`}
            >
              {section.icon}
            </div>
            <div>
              <h2 className="body-default font-semibold text-main group-hover:text-primary-main transition-colors">
                {section.title}
              </h2>
              <p className="caption text-secondary mt-s4">{section.description}</p>
            </div>
            <span className="caption text-primary-main font-semibold mt-auto flex items-center gap-s4">
              Manage →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
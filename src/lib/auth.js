import GoogleProvider from "next-auth/providers/google";

function getBackendUrl() {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error("BACKEND_URL is not set in .env.local");
  }
  return url.replace(/\/$/, "");
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user }) {
      try {
        const backend = getBackendUrl();
        const res = await fetch(`${backend}/api/admins/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        return !!data.allowed;
      } catch (error) {
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user && account) {
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        try {
          const backend = getBackendUrl();
          const res = await fetch(`${backend}/api/admins/auth/sync-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user?.id) token.id = data.user.id;
          }
        } catch (e) {}
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};
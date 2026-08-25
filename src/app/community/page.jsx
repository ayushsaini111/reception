"use client";

import { useEffect, useState } from "react";

export default function AdminCommunityPage() {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/backend/user/community?all=true", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { count: 0, joins: [] }))
      .then(setData)
      .catch(() => setData({ count: 0, joins: [] }));

    return () => controller.abort();
  }, []);

  if (data === undefined) {
    return <div className="p-s24 body-default text-secondary">Loading…</div>;
  }

  return (
    <div className="p-s24">
      <h2 className="heading-h4 text-main mb-s16">
        Community Joins ({data.count})
      </h2>

      <table className="w-full text-left body-small">
        <thead>
          <tr className="border-b border-secondary-dark">
            <th className="py-s8">Name</th>
            <th className="py-s8">Phone</th>
            <th className="py-s8">Email</th>
            <th className="py-s8">Joined At</th>
          </tr>
        </thead>
        <tbody>
          {data.joins.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-s16 text-secondary text-center">
                No joins yet.
              </td>
            </tr>
          ) : (
            data.joins.map((j) => (
              <tr key={j.id} className="border-b border-secondary-dark">
                <td className="py-s8">{j.user?.name ?? "—"}</td>
                <td className="py-s8">{j.user?.phone ?? "—"}</td>
                <td className="py-s8">{j.user?.email ?? "—"}</td>
                <td className="py-s8">
                  {new Date(j.joinedAt).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { SearchService } from "@/lib/server/searchService";
import Link from "next/link";

export const revalidate = 60;

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) redirect("/login?callbackUrl=/admin/analytics");

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) redirect("/");

  const searchService = new SearchService();

  // Get analytics data
  const [searchAnalytics, trendingQueries, popularFilters] = await Promise.all([
    searchService.getSearchAnalytics(),
    searchService.getTrendingQueries(10),
    searchService.getPopularFilters(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Search & Analytics
          </h1>
          <p className="text-neutral-600 mt-2">
            Monitor search performance and user behavior
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm rounded bg-neutral-200 text-neutral-900 px-3 py-2 hover:bg-neutral-300"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Searches"
          value={searchAnalytics.totalSearches.toLocaleString()}
          trend="+12% from last week"
          color="blue"
        />
        <MetricCard
          title="Avg Results"
          value={searchAnalytics.avgResultsPerSearch.toString()}
          trend="+5% from last week"
          color="green"
        />
        <MetricCard
          title="No Results Rate"
          value={`${searchAnalytics.noResultsRate}%`}
          trend="-8% from last week"
          color="yellow"
        />
        <MetricCard
          title="Click-through Rate"
          value={`${searchAnalytics.clickThroughRate}%`}
          trend="+15% from last week"
          color="purple"
        />
      </section>

      {/* Trending Queries */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Trending Search Queries</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Query</th>
                <th className="text-left py-3 px-4 font-medium">Count</th>
                <th className="text-left py-3 px-4 font-medium">Trend</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trendingQueries.map((query, index) => (
                <tr key={index} className="border-t hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium">{query.query}</td>
                  <td className="py-3 px-4">{query.count}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        query.trend > 0
                          ? "bg-green-100 text-green-800"
                          : query.trend < 0
                          ? "bg-red-100 text-red-800"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {query.trend > 0 ? "+" : ""}
                      {query.trend}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-sm text-blue-600 hover:underline">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Popular Filters */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Most Used Filters</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popularFilters.map((filter, index) => (
            <div key={index} className="bg-white rounded-lg border p-4">
              <h3 className="font-medium text-neutral-900">{filter.type}</h3>
              <div className="mt-2 space-y-1">
                {filter.values.slice(0, 3).map((value, valueIndex) => (
                  <div
                    key={valueIndex}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-neutral-600">{value.value}</span>
                    <span className="font-medium">{value.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Search Performance Chart Placeholder */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Search Performance Over Time</h2>
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="text-neutral-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-neutral-600">Chart visualization coming soon</p>
          <p className="text-sm text-neutral-500 mt-2">
            Integration with analytics library needed
          </p>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  color,
}: {
  title: string;
  value: string;
  trend: string;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    purple: "bg-purple-50 border-purple-200",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{trend}</p>
    </div>
  );
}

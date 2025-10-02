import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Mock trending searches - will be replaced with real data once analytics are configured
    const mockTrending = [
      { query: "summer dresses", count: 1250 },
      { query: "sneakers", count: 980 },
      { query: "jeans", count: 847 },
      { query: "t-shirts", count: 765 },
      { query: "accessories", count: 623 },
      { query: "jackets", count: 542 },
      { query: "bags", count: 489 },
      { query: "shoes", count: 456 },
    ];

    return NextResponse.json({ trending: mockTrending });
  } catch (error) {
    console.error("Error fetching trending searches:", error);
    return NextResponse.json({ trending: [] });
  }
}

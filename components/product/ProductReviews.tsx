"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  user: {
    name: string;
    id: string;
  };
  userHelpful?: boolean;
}

interface ReviewsProps {
  productId: string;
  averageRating: number;
  totalReviews: number;
  canReview: boolean;
}

const StarRating = ({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? "text-yellow-400" : "text-neutral-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export default function ProductReviews({
  productId,
  averageRating,
  totalReviews,
  canReview,
}: ReviewsProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [productId, sortBy, filterBy]);

  async function loadReviews(pageNum = 1) {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
        sort: sortBy,
        filter: filterBy,
      });

      const res = await fetch(`/api/products/${productId}/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setReviews(data.reviews);
        } else {
          setReviews((prev) => [...prev, ...data.reviews]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  }

  async function markHelpful(reviewId: string, helpful: boolean) {
    if (!session) return;

    try {
      const res = await fetch(
        `/api/products/${productId}/reviews/${reviewId}/helpful`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ helpful }),
        }
      );

      if (res.ok) {
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  helpful: helpful ? review.helpful + 1 : review.helpful - 1,
                  userHelpful: helpful,
                }
              : review
          )
        );
      }
    } catch (e) {
      console.error("Failed to mark helpful:", e);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Customer Reviews</h2>
          {canReview && session && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-neutral-900 text-white px-4 py-2 rounded text-sm hover:bg-neutral-800"
            >
              Write a Review
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} size="md" />
            <span className="text-lg font-medium">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-neutral-600">({totalReviews} reviews)</span>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4 text-sm">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-3 py-1 focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="border rounded px-3 py-1 focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="all">All Reviews</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
            <option value="verified">Verified Purchases</option>
          </select>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onClose={() => setShowReviewForm(false)}
          onSubmit={() => {
            setShowReviewForm(false);
            loadReviews(1);
          }}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            <p>No reviews yet. Be the first to review this product!</p>
            {!session && (
              <p className="mt-2">
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="font-medium">{review.title}</span>
                    {review.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  <p className="text-neutral-700">{review.content}</p>

                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span>{review.user.name}</span>
                    <span>•</span>
                    <span>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {session && (
                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-sm text-neutral-600">
                        Was this helpful?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markHelpful(review.id, true)}
                          disabled={review.userHelpful === true}
                          className={`text-xs px-2 py-1 rounded border ${
                            review.userHelpful === true
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "hover:bg-neutral-50"
                          }`}
                        >
                          👍 Yes ({review.helpful})
                        </button>
                        <button
                          onClick={() => markHelpful(review.id, false)}
                          disabled={review.userHelpful === false}
                          className={`text-xs px-2 py-1 rounded border ${
                            review.userHelpful === false
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "hover:bg-neutral-50"
                          }`}
                        >
                          👎 No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {hasMore && reviews.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => loadReviews(page + 1)}
              className="bg-neutral-100 hover:bg-neutral-200 px-6 py-2 rounded border text-sm"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Review Form Component
function ReviewForm({
  productId,
  onClose,
  onSubmit,
}: {
  productId: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, content }),
      });

      if (res.ok) {
        onSubmit();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
      }
    } catch (e) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Write a Review</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-8 h-8 ${
                    star <= rating ? "text-yellow-400" : "text-neutral-300"
                  } hover:text-yellow-400`}
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Review Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Summarize your review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Review Details
            </label>
            <textarea
              id="content"
              placeholder="Tell others about your experience with this product"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 bg-neutral-900 text-white py-2 rounded hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

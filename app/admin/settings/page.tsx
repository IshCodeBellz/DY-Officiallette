import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";

export const revalidate = 300; // 5 minutes

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) redirect("/login?callbackUrl=/admin/settings");

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) redirect("/");

  // Mock system settings - in production, these would be stored in database
  const systemSettings = {
    site: {
      name: "ASOS Clone",
      description: "Modern e-commerce platform",
      url: "https://asos-clone.com",
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.ico",
    },
    email: {
      fromName: "ASOS Clone",
      fromEmail: "noreply@asos-clone.com",
      smtpHost: "smtp.sendgrid.net",
      smtpPort: 587,
      smtpSecure: true,
    },
    checkout: {
      currency: "USD",
      taxRate: 8.5,
      shippingFee: 9.99,
      freeShippingThreshold: 75.0,
      allowGuestCheckout: true,
    },
    features: {
      enableWishlist: true,
      enableReviews: true,
      enableSocialLogin: true,
      enableSearchSuggestions: true,
      enablePersonalization: true,
    },
    limits: {
      maxCartItems: 50,
      maxWishlistItems: 100,
      maxImageUploads: 10,
      maxReviewLength: 1000,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure global system preferences and features
              </p>
            </div>
            <Link
              href="/admin"
              className="text-sm rounded bg-neutral-200 text-neutral-900 px-3 py-2 hover:bg-neutral-300"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <form className="space-y-8">
          {/* Site Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Site Configuration
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Basic site information and branding
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    defaultValue={systemSettings.site.name}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    defaultValue={systemSettings.site.url}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    defaultValue={systemSettings.site.description}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    defaultValue={systemSettings.site.logoUrl}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    defaultValue={systemSettings.site.faviconUrl}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Email Configuration
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure email settings for notifications and marketing
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    defaultValue={systemSettings.email.fromName}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    defaultValue={systemSettings.email.fromEmail}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    defaultValue={systemSettings.email.smtpHost}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    defaultValue={systemSettings.email.smtpPort}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    defaultChecked={systemSettings.email.smtpSecure}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="smtpSecure"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Use SSL/TLS
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Checkout & Pricing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure payment, pricing, and checkout behavior
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select
                    defaultValue={systemSettings.checkout.currency}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={systemSettings.checkout.taxRate}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Fee ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={systemSettings.checkout.shippingFee}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={systemSettings.checkout.freeShippingThreshold}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="guestCheckout"
                    defaultChecked={systemSettings.checkout.allowGuestCheckout}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="guestCheckout"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Allow Guest Checkout
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Feature Flags
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Enable or disable platform features
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableWishlist"
                    defaultChecked={systemSettings.features.enableWishlist}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableWishlist"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable Wishlist
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableReviews"
                    defaultChecked={systemSettings.features.enableReviews}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableReviews"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable Product Reviews
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableSocialLogin"
                    defaultChecked={systemSettings.features.enableSocialLogin}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableSocialLogin"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable Social Login
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableSearchSuggestions"
                    defaultChecked={
                      systemSettings.features.enableSearchSuggestions
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableSearchSuggestions"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable Search Suggestions
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enablePersonalization"
                    defaultChecked={
                      systemSettings.features.enablePersonalization
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enablePersonalization"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable Personalization
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* System Limits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                System Limits
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure application limits and constraints
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Cart Items
                  </label>
                  <input
                    type="number"
                    defaultValue={systemSettings.limits.maxCartItems}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Wishlist Items
                  </label>
                  <input
                    type="number"
                    defaultValue={systemSettings.limits.maxWishlistItems}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Image Uploads per Product
                  </label>
                  <input
                    type="number"
                    defaultValue={systemSettings.limits.maxImageUploads}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Review Length (characters)
                  </label>
                  <input
                    type="number"
                    defaultValue={systemSettings.limits.maxReviewLength}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Maintenance Mode
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Control site availability during maintenance
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="maintenanceMode"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Enable Maintenance Mode
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    placeholder="We're currently performing maintenance. Please check back soon!"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Return Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  Reset to Defaults
                </button>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Import Configuration
                </button>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Export Configuration
                </button>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              System Information
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Current system status and statistics
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <span className="text-sm text-gray-600">
                  Application Version
                </span>
                <div className="font-medium text-gray-900">v1.4.0</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Environment</span>
                <div className="font-medium text-gray-900">Production</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Last Updated</span>
                <div className="font-medium text-gray-900">October 1, 2025</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Users</span>
                <div className="font-medium text-gray-900">12,567</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Products</span>
                <div className="font-medium text-gray-900">1,247</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Orders</span>
                <div className="font-medium text-gray-900">3,456</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

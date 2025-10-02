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
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            System Settings
          </h1>
          <p className="text-neutral-600 mt-2">
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

      <form className="space-y-8">
        {/* Site Configuration */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Site Configuration</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Site Name
              </label>
              <input
                type="text"
                defaultValue={systemSettings.site.name}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Site URL</label>
              <input
                type="url"
                defaultValue={systemSettings.site.url}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Site Description
              </label>
              <textarea
                defaultValue={systemSettings.site.description}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="url"
                defaultValue={systemSettings.site.logoUrl}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Favicon URL
              </label>
              <input
                type="url"
                defaultValue={systemSettings.site.faviconUrl}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Email Configuration */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                From Name
              </label>
              <input
                type="text"
                defaultValue={systemSettings.email.fromName}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                From Email
              </label>
              <input
                type="email"
                defaultValue={systemSettings.email.fromEmail}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                defaultValue={systemSettings.email.smtpHost}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                defaultValue={systemSettings.email.smtpPort}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smtpSecure"
                defaultChecked={systemSettings.email.smtpSecure}
                className="mr-2"
              />
              <label htmlFor="smtpSecure" className="text-sm">
                Use SSL/TLS
              </label>
            </div>
          </div>
        </section>

        {/* Checkout Configuration */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Checkout & Pricing</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Default Currency
              </label>
              <select
                defaultValue={systemSettings.checkout.currency}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={systemSettings.checkout.taxRate}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Shipping Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={systemSettings.checkout.shippingFee}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Free Shipping Threshold ($)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={systemSettings.checkout.freeShippingThreshold}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="guestCheckout"
                defaultChecked={systemSettings.checkout.allowGuestCheckout}
                className="mr-2"
              />
              <label htmlFor="guestCheckout" className="text-sm">
                Allow Guest Checkout
              </label>
            </div>
          </div>
        </section>

        {/* Feature Flags */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableWishlist"
                defaultChecked={systemSettings.features.enableWishlist}
                className="mr-2"
              />
              <label htmlFor="enableWishlist" className="text-sm">
                Enable Wishlist
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableReviews"
                defaultChecked={systemSettings.features.enableReviews}
                className="mr-2"
              />
              <label htmlFor="enableReviews" className="text-sm">
                Enable Product Reviews
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableSocialLogin"
                defaultChecked={systemSettings.features.enableSocialLogin}
                className="mr-2"
              />
              <label htmlFor="enableSocialLogin" className="text-sm">
                Enable Social Login
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableSearchSuggestions"
                defaultChecked={systemSettings.features.enableSearchSuggestions}
                className="mr-2"
              />
              <label htmlFor="enableSearchSuggestions" className="text-sm">
                Enable Search Suggestions
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enablePersonalization"
                defaultChecked={systemSettings.features.enablePersonalization}
                className="mr-2"
              />
              <label htmlFor="enablePersonalization" className="text-sm">
                Enable Personalization
              </label>
            </div>
          </div>
        </section>

        {/* System Limits */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">System Limits</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Cart Items
              </label>
              <input
                type="number"
                defaultValue={systemSettings.limits.maxCartItems}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Wishlist Items
              </label>
              <input
                type="number"
                defaultValue={systemSettings.limits.maxWishlistItems}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Image Uploads per Product
              </label>
              <input
                type="number"
                defaultValue={systemSettings.limits.maxImageUploads}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Review Length (characters)
              </label>
              <input
                type="number"
                defaultValue={systemSettings.limits.maxReviewLength}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Maintenance Mode */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" id="maintenanceMode" className="mr-2" />
              <label htmlFor="maintenanceMode" className="text-sm font-medium">
                Enable Maintenance Mode
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Maintenance Message
              </label>
              <textarea
                placeholder="We're currently performing maintenance. Please check back soon!"
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Estimated Return Time
              </label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              type="button"
              className="text-sm border rounded-lg px-4 py-2 hover:bg-neutral-50"
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* System Information */}
      <section className="bg-neutral-50 rounded-lg p-6">
        <h3 className="font-medium mb-4">System Information</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <span className="text-sm text-neutral-600">
              Application Version
            </span>
            <div className="font-medium">v1.4.0</div>
          </div>
          <div>
            <span className="text-sm text-neutral-600">Environment</span>
            <div className="font-medium">Production</div>
          </div>
          <div>
            <span className="text-sm text-neutral-600">Last Updated</span>
            <div className="font-medium">October 1, 2025</div>
          </div>
          <div>
            <span className="text-sm text-neutral-600">Total Users</span>
            <div className="font-medium">12,567</div>
          </div>
          <div>
            <span className="text-sm text-neutral-600">Total Products</span>
            <div className="font-medium">1,247</div>
          </div>
          <div>
            <span className="text-sm text-neutral-600">Total Orders</span>
            <div className="font-medium">3,456</div>
          </div>
        </div>
      </section>
    </div>
  );
}

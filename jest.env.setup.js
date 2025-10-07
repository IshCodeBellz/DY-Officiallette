// jest.env.setup.js
// Try to load .env.local first, then fallback to .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

// In CI, ensure we use the environment variable if it's set
if (process.env.CI && process.env.DATABASE_URL) {
  console.log("CI environment detected, using DATABASE_URL from environment");
}

// Optionally log for debug:
console.log("Jest loaded DATABASE_URL:", process.env.DATABASE_URL);
console.log("Node environment:", process.env.NODE_ENV);
console.log("CI environment:", process.env.CI);

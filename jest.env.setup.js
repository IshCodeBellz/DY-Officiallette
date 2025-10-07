// jest.env.setup.js
// Try to load .env.local first, then fallback to .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

// Optionally log for debug:
console.log("Jest loaded DATABASE_URL:", process.env.DATABASE_URL);

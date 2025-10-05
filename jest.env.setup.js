// jest.env.setup.js
require("dotenv").config({ path: ".env.local" });

// Optionally log for debug:
console.log("Jest loaded DATABASE_URL:", process.env.DATABASE_URL);

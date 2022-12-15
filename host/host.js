import "dotenv/config";
import express from "express";
import path from "path";
import url from "url";
import cors from "cors";
import compression from "cors";
import rateLimit from "express-rate-limit";

const production = process.env["NODE_ENV"] === "production";
const rateLimitMinute = process.env["RATELIMIT"]
  ? Number(process.env["RATELIMIT"])
  : 30;
const port = process.env["PORT"] ? Number(process.env["PORT"]) : 4360;
const maxsize = process.env["MAXSIZE"] ?? "16kb";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url)); // const __filename = url.fileURLToPath(import.meta.url);
const root = path.join(__dirname, "..", "dist");

console.log(`RATE LIMIT: ${rateLimitMinute} rpm`);
console.log(`MAX SIZE: ${maxsize}`);

async function shutdown(signal) {
  console.log(`*^!@4=> Received signal to terminate: ${signal}`);
  process.kill(process.pid, signal);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log(`Blockcore NostrWeb starting on port ${port}.`);

const app = express();

const asyncHandler = (fun) => (req, res, next) => {
  Promise.resolve(fun(req, res, next)).catch(next);
};

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: rateLimitMinute,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
// app.use(limiter);

// Apply the rate limiting middleware to API calls only
// app.use('/api', apiLimiter)

app.use(cors());
app.use(express.json());
app.use(
  compression({
    threshold: 512,
  })
);

app.disable("x-powered-by");

app.use("/", express.static(root));

// For every url request we send our index.html file to the route
app.get("/*", (_req, res) => {
  res.sendFile(path.join(root, "index.html"));
});

try {
  // Run the HTTP server that responds to queries.
  app.listen(port, () => {
    console.log(`Blockcore NostrWeb running on http://localhost:${port}`);
  });
} catch (error) {
  const serializedError = JSON.stringify(
    error,
    Object.getOwnPropertyNames(error)
  );
  console.log(
    `Blockcore NostrWeb initialization failed with error ${serializedError}`
  );
  process.exit(1);
}

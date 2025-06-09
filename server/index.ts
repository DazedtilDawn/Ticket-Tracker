import express, { type Request, Response, NextFunction } from "express";
import { fileURLToPath } from "node:url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleChoreResetJob } from "./jobs/resetChores";
import cron from "node-cron";
import { resetDailyBonuses } from "./cron/daily-bonus-reset";
import cookieParser from "cookie-parser";

// Export a named function to create the configured Express app
export async function createServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Add cookie parser for refresh tokens
  app.use(cookieParser());

  // Serve uploaded files statically from the public/uploads directory
  app.use("/uploads", express.static("public/uploads"));

  // Serve sound files with proper MIME types
  app.use(
    "/sounds",
    express.static("public/sounds", {
      setHeaders: (res, path) => {
        if (path.endsWith(".mp3")) {
          res.set("Content-Type", "audio/mpeg");
        } else if (path.endsWith(".ogg")) {
          res.set("Content-Type", "audio/ogg");
        } else if (path.endsWith(".wav")) {
          res.set("Content-Type", "audio/wav");
        }
      },
    }),
  );

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // Register routes
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  return { app, server };
}

// Start server function
export async function startServer() {
  const { app, server } = await createServer();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Render injects PORT; default to 5001 for local dev (5000 conflicts with macOS)
  const port = Number(process.env.PORT) || 5001;
  server.listen(port, () => {
    log(`serving on port ${port}`);
    
    // Schedule the daily chore reset job
    scheduleChoreResetJob();
    
    // Schedule the daily bonus reset job (runs at 00:00 server local time)
    cron.schedule("0 0 * * *", resetDailyBonuses, {
      timezone: "America/Los_Angeles" // Adjust timezone as needed
    });
    log("Daily bonus reset job scheduled for 00:00 server time");
  });
}

// Default export for backward compatibility
export default createServer;

// Start the server when this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

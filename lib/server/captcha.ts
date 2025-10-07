import { NextRequest } from "next/server";

export interface CaptchaConfig {
  provider: "recaptcha" | "hcaptcha" | "turnstile" | "mock";
  siteKey: string;
  secretKey: string;
  threshold?: number; // For reCAPTCHA v3 (0.0 - 1.0)
  enabled: boolean;
}

export interface CaptchaVerificationResult {
  success: boolean;
  score?: number; // For reCAPTCHA v3
  action?: string;
  hostname?: string;
  challengeTs?: string;
  errorCodes?: string[];
}

export interface CaptchaContext {
  userAgent: string;
  ipAddress: string;
  endpoint: string;
  riskScore?: number;
}

/**
 * CAPTCHA service for spam and abuse prevention
 */
export class CaptchaService {
  private static configs: Record<string, CaptchaConfig> = {
    login: {
      provider: "recaptcha",
      siteKey: process.env.RECAPTCHA_SITE_KEY || "",
      secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
      threshold: 0.5,
      enabled: process.env.NODE_ENV === "production",
    },
    register: {
      provider: "recaptcha",
      siteKey: process.env.RECAPTCHA_SITE_KEY || "",
      secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
      threshold: 0.7,
      enabled: true,
    },
    checkout: {
      provider: "recaptcha",
      siteKey: process.env.RECAPTCHA_SITE_KEY || "",
      secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
      threshold: 0.6,
      enabled: true,
    },
    contact: {
      provider: "recaptcha",
      siteKey: process.env.RECAPTCHA_SITE_KEY || "",
      secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
      threshold: 0.5,
      enabled: true,
    },
  };

  /**
   * Verify CAPTCHA token
   */
  static async verifyCaptcha(
    token: string,
    context: CaptchaContext,
    configKey: string = "default"
  ): Promise<CaptchaVerificationResult> {
    const config = this.configs[configKey] || this.configs.login;

    if (!config.enabled) {
      // Skip CAPTCHA in development or when disabled
      return {
        success: true,
        score: 1.0,
        action: "development_mode",
      };
    }

    if (!token) {
      return {
        success: false,
        errorCodes: ["missing-input-response"],
      };
    }

    try {
      switch (config.provider) {
        case "recaptcha":
          return await this.verifyRecaptcha(token, config, context);
        case "hcaptcha":
          return await this.verifyHCaptcha(token, config, context);
        case "turnstile":
          return await this.verifyTurnstile(token, config, context);
        case "mock":
          return this.verifyMock(token, config, context);
        default:
          throw new Error(`Unsupported CAPTCHA provider: ${config.provider}`);
      }
    } catch (error) {
      console.error("Error:", error);
      console.error("CAPTCHA verification error:", error);

      return {
        success: false,
        errorCodes: ["verification-failed"],
      };
    }
  }

  /**
   * Verify reCAPTCHA token
   */
  private static async verifyRecaptcha(
    token: string,
    config: CaptchaConfig,
    context: CaptchaContext
  ): Promise<CaptchaVerificationResult> {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: config.secretKey,
          response: token,
          remoteip: context.ipAddress,
        }),
      }
    );

    const data = await response.json();

    // For reCAPTCHA v3, check score threshold
    if (config.threshold && data.score !== undefined) {
      data.success = data.success && data.score >= config.threshold;
    }

    return {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
      errorCodes: data["error-codes"],
    };
  }

  /**
   * Verify hCaptcha token
   */
  private static async verifyHCaptcha(
    token: string,
    config: CaptchaConfig,
    context: CaptchaContext
  ): Promise<CaptchaVerificationResult> {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: token,
        remoteip: context.ipAddress,
        sitekey: config.siteKey,
      }),
    });

    const data = await response.json();

    return {
      success: data.success,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
      errorCodes: data["error-codes"],
    };
  }

  /**
   * Verify Cloudflare Turnstile token
   */
  private static async verifyTurnstile(
    token: string,
    config: CaptchaConfig,
    context: CaptchaContext
  ): Promise<CaptchaVerificationResult> {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: config.secretKey,
          response: token,
          remoteip: context.ipAddress,
        }),
      }
    );

    const data = await response.json();

    return {
      success: data.success,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
      errorCodes: data["error-codes"],
    };
  }

  /**
   * Mock CAPTCHA for development
   */
  private static verifyMock(
    token: string,
    config: CaptchaConfig,
    context: CaptchaContext
  ): CaptchaVerificationResult {
    // Simple mock logic
    const success = token === "mock_success_token" || token.length > 10;

    return {
      success,
      score: success ? 0.9 : 0.1,
      action: "mock_action",
      hostname: "localhost",
      challengeTs: new Date().toISOString(),
    };
  }

  /**
   * Determine if CAPTCHA is required based on risk assessment
   */
  static shouldRequireCaptcha(context: {
    riskScore?: number;
    failedAttempts?: number;
    isNewUser?: boolean;
    isVPN?: boolean;
    endpoint: string;
  }): boolean {
    const {
      riskScore = 0,
      failedAttempts = 0,
      isNewUser = false,
      isVPN = false,
      endpoint,
    } = context;

    // Always require for registration
    if (endpoint.includes("register")) {
      return true;
    }

    // High-risk scenarios
    if (riskScore >= 70) return true;
    if (failedAttempts >= 3) return true;
    if (isVPN && endpoint.includes("login")) return true;

    // Specific endpoint rules
    const endpointRules: Record<string, boolean> = {
      "/api/auth/login": failedAttempts >= 2,
      "/api/checkout": riskScore >= 50,
      "/api/contact": true, // Always for contact forms
      "/api/reviews": isNewUser || riskScore >= 40,
    };

    return endpointRules[endpoint] || false;
  }

  /**
   * Get CAPTCHA configuration for frontend
   */
  static getClientConfig(configKey: string = "default"): {
    provider: string;
    siteKey: string;
    enabled: boolean;
    threshold?: number;
  } {
    const config = this.configs[configKey] || this.configs.login;

    return {
      provider: config.provider,
      siteKey: config.siteKey,
      enabled: config.enabled,
      threshold: config.threshold,
    };
  }

  /**
   * Update CAPTCHA configuration
   */
  static updateConfig(
    configKey: string,
    updates: Partial<CaptchaConfig>
  ): void {
    if (!this.configs[configKey]) {
      this.configs[configKey] = { ...this.configs.login };
    }

    this.configs[configKey] = {
      ...this.configs[configKey],
      ...updates,
    };
  }

  /**
   * Create CAPTCHA middleware
   */
  static createCaptchaMiddleware(configKey: string = "default") {
    return async (req: NextRequest) => {
      const config = this.configs[configKey] || this.configs.login;

      if (!config.enabled) {
        return { required: false, verified: true };
      }

      const body = await req.json().catch(() => ({}));
      const captchaToken =
        body.captchaToken || req.headers.get("x-captcha-token");

      const context: CaptchaContext = {
        userAgent: req.headers.get("user-agent") || "unknown",
        ipAddress: this.extractIP(req),
        endpoint: req.nextUrl.pathname,
      };

      if (!captchaToken) {
        return {
          required: true,
          verified: false,
          error: "CAPTCHA token required",
        };
      }

      const result = await this.verifyCaptcha(captchaToken, context, configKey);

      return {
        required: true,
        verified: result.success,
        score: result.score,
        error: result.success ? undefined : "CAPTCHA verification failed",
      };
    };
  }

  /**
   * Extract IP from request
   */
  private static extractIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    const cfIP = req.headers.get("cf-connecting-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (cfIP) {
      return cfIP;
    }

    return req.ip || "unknown";
  }

  /**
   * Generate CAPTCHA analytics
   */
  static async getAnalytics(timeRange: { start: Date; end: Date }): Promise<{
    totalVerifications: number;
    successRate: number;
    averageScore: number;
    topFailureReasons: Array<{ reason: string; count: number }>;
  }> {
    // In production, this would query analytics database
    return {
      totalVerifications: 0,
      successRate: 0,
      averageScore: 0,
      topFailureReasons: [],
    };
  }
}

import { NextRequest } from "next/server";

export interface IPInfo {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  isVPN?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  riskScore: number; // 0-100
}

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * IP-based security and geolocation service
 */
export class IPSecurityService {
  // High-risk countries (configurable based on security policy)
  private static readonly HIGH_RISK_COUNTRIES = [
    "CN",
    "RU",
    "KP",
    "IR",
    "SY",
    "IQ",
    "AF",
    "MM",
    "BY",
  ];

  // Known VPN/proxy IP ranges (simplified example)
  private static readonly VPN_INDICATORS = [
    "amazonaws.com",
    "digitalocean.com",
    "linode.com",
    "vultr.com",
    "hetzner.com",
  ];

  /**
   * Analyze IP address for security risks
   */
  static async analyzeIP(ip: string): Promise<IPInfo> {
    try {
      // In production, this would use services like:
      // - IPinfo.io
      // - MaxMind GeoIP2
      // - IP2Location
      // - Fraud detection APIs

      const geoData = await this.getGeoLocation(ip);
      const isVPN = await this.detectVPN(ip);
      const isProxy = await this.detectProxy(ip);
      const isTor = await this.detectTor(ip);

      const riskScore = this.calculateIPRiskScore({
        ip,
        countryCode: geoData?.countryCode,
        isVPN,
        isProxy,
        isTor,
      });

      return {
        ip,
        country: geoData?.country,
        countryCode: geoData?.countryCode,
        region: geoData?.region,
        city: geoData?.city,
        latitude: geoData?.latitude,
        longitude: geoData?.longitude,
        timezone: geoData?.timezone,
        isVPN,
        isProxy,
        isTor,
        riskScore,
      };
    } catch (error) {
      console.error("IP analysis error:", error);

      // Return safe defaults on error
      return {
        ip,
        riskScore: 50, // Medium risk if we can't determine
        isVPN: false,
        isProxy: false,
        isTor: false,
      };
    }
  }

  /**
   * Get geolocation data for IP
   */
  static async getGeoLocation(ip: string): Promise<GeoLocation | null> {
    try {
      // Skip for local/private IPs
      if (this.isPrivateIP(ip)) {
        return {
          country: "Local",
          countryCode: "LOCAL",
          region: "Local",
          city: "Local",
          latitude: 0,
          longitude: 0,
          timezone: "UTC",
        };
      }

      // In production, integrate with geolocation service
      // For now, return mock data
      return {
        country: "United States",
        countryCode: "US",
        region: "California",
        city: "San Francisco",
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: "America/Los_Angeles",
      };
    } catch (error) {
      console.error("Geolocation error:", error);
      return null;
    }
  }

  /**
   * Detect if IP is from VPN
   */
  static async detectVPN(ip: string): Promise<boolean> {
    try {
      // Check against known VPN providers
      const reverseDNS = await this.getReverseDNS(ip);

      if (reverseDNS) {
        for (const indicator of this.VPN_INDICATORS) {
          if (reverseDNS.includes(indicator)) {
            return true;
          }
        }
      }

      // Additional VPN detection methods:
      // - Check against VPN IP databases
      // - Analyze connection patterns
      // - Check for datacenter ranges

      return false;
    } catch (error) {
      console.error("VPN detection error:", error);
      return false;
    }
  }

  /**
   * Detect if IP is from proxy
   */
  static async detectProxy(ip: string): Promise<boolean> {
    try {
      // In production, use proxy detection services
      // Check for common proxy headers, open ports, etc.

      return false;
    } catch (error) {
      console.error("Proxy detection error:", error);
      return false;
    }
  }

  /**
   * Detect if IP is from Tor exit node
   */
  static async detectTor(ip: string): Promise<boolean> {
    try {
      // In production, check against Tor exit node list
      // Available from: https://check.torproject.org/exit-addresses

      return false;
    } catch (error) {
      console.error("Tor detection error:", error);
      return false;
    }
  }

  /**
   * Calculate risk score for IP address
   */
  static calculateIPRiskScore(data: {
    ip: string;
    countryCode?: string;
    isVPN?: boolean;
    isProxy?: boolean;
    isTor?: boolean;
  }): number {
    let score = 0;

    // Base score for unknown/suspicious sources
    score += 20;

    // High-risk country penalty
    if (
      data.countryCode &&
      this.HIGH_RISK_COUNTRIES.includes(data.countryCode)
    ) {
      score += 30;
    }

    // VPN/Proxy penalties
    if (data.isVPN) score += 25;
    if (data.isProxy) score += 30;
    if (data.isTor) score += 40;

    // Private/local IPs are generally safe
    if (this.isPrivateIP(data.ip)) {
      score = Math.max(0, score - 30);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Check if IP is private/local
   */
  static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    return privateRanges.some((range) => range.test(ip));
  }

  /**
   * Get reverse DNS for IP
   */
  static async getReverseDNS(ip: string): Promise<string | null> {
    try {
      // In production, use DNS lookup
      // For now, return null
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if country is blocked
   */
  static isBlockedCountry(countryCode: string): boolean {
    // This would be configurable in production
    const blockedCountries = ["KP", "SY"]; // Example: North Korea, Syria
    return blockedCountries.includes(countryCode);
  }

  /**
   * Extract IP from Next.js request
   */
  static extractIP(req: NextRequest): string {
    // Check various headers for the real IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    const cfIP = req.headers.get("cf-connecting-ip"); // Cloudflare

    if (forwarded) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwarded.split(",")[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (cfIP) {
      return cfIP;
    }

    // Fallback to connection remote address
    return req.ip || "unknown";
  }

  /**
   * Create IP security middleware
   */
  static createIPSecurityMiddleware(
    options: {
      blockHighRisk?: boolean;
      blockVPN?: boolean;
      blockTor?: boolean;
      blockCountries?: string[];
      riskThreshold?: number;
    } = {}
  ) {
    return async (req: NextRequest) => {
      const {
        blockHighRisk = false,
        blockVPN = false,
        blockTor = false,
        blockCountries = [],
        riskThreshold = 80,
      } = options;

      try {
        const ip = this.extractIP(req);
        const ipInfo = await this.analyzeIP(ip);

        // Check blocking conditions
        if (blockHighRisk && ipInfo.riskScore >= riskThreshold) {
          return {
            blocked: true,
            reason: `High risk IP (score: ${ipInfo.riskScore})`,
            ipInfo,
          };
        }

        if (blockVPN && ipInfo.isVPN) {
          return {
            blocked: true,
            reason: "VPN detected",
            ipInfo,
          };
        }

        if (blockTor && ipInfo.isTor) {
          return {
            blocked: true,
            reason: "Tor exit node detected",
            ipInfo,
          };
        }

        if (
          blockCountries.length > 0 &&
          ipInfo.countryCode &&
          blockCountries.includes(ipInfo.countryCode)
        ) {
          return {
            blocked: true,
            reason: `Country blocked: ${ipInfo.country}`,
            ipInfo,
          };
        }

        return {
          blocked: false,
          ipInfo,
        };
      } catch (error) {
        console.error("IP security middleware error:", error);

        // Allow request on error to avoid blocking legitimate users
        return {
          blocked: false,
          error: "IP security check failed",
          ipInfo: {
            ip: this.extractIP(req),
            riskScore: 50,
            isVPN: false,
            isProxy: false,
            isTor: false,
          },
        };
      }
    };
  }

  /**
   * Get IP reputation from multiple sources
   */
  static async getIPReputation(ip: string): Promise<{
    reputation: "good" | "suspicious" | "malicious" | "unknown";
    sources: string[];
    details: Record<string, any>;
  }> {
    try {
      // In production, check against:
      // - AbuseIPDB
      // - VirusTotal
      // - Project Honey Pot
      // - Spamhaus
      // - Internal threat intelligence

      return {
        reputation: "good",
        sources: ["mock"],
        details: { message: "No reputation data available in development" },
      };
    } catch (error) {
      console.error("IP reputation check error:", error);

      return {
        reputation: "unknown",
        sources: [],
        details: { error: "Reputation check failed" },
      };
    }
  }
}

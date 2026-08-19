export interface RateLimitInfo {
  count: number
  resetTime: number
}

const rateLimiter = new Map<string, RateLimitInfo>()

/**
 * Simple in-memory rate limiter
 * @param identifier - Unique identifier for the rate limit (e.g., "upload:userId" or "login:ip")
 * @param limit - Maximum allowed requests in the time window
 * @param windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
 * @returns boolean - True if the request is allowed, false if rate limited
 */
export function checkRateLimit(identifier: string, limit: number, windowMs = 60000): boolean {
  const now = Date.now()
  const currentLimit = rateLimiter.get(identifier)

  // Clean up expired entry
  if (currentLimit && currentLimit.resetTime < now) {
    rateLimiter.delete(identifier)
  }

  const activeLimit = rateLimiter.get(identifier)

  if (!activeLimit) {
    rateLimiter.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (activeLimit.count >= limit) {
    return false
  }

  activeLimit.count += 1
  rateLimiter.set(identifier, activeLimit)
  return true
}

// Memory cleanup utility to prevent Map from growing indefinitely
setInterval(() => {
  const now = Date.now()
  rateLimiter.forEach((value, key) => {
    if (value.resetTime < now) {
      rateLimiter.delete(key)
    }
  })
}, 60000)

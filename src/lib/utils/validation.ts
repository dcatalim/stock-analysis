// Rate limiting utility
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
	const now = Date.now();
	const record = requestCounts.get(key);

	if (!record || now > record.resetTime) {
		requestCounts.set(key, { count: 1, resetTime: now + windowMs });
		return true;
	}

	if (record.count >= maxRequests) {
		return false;
	}

	record.count++;
	return true;
}

// Input validation
export function validateTicker(ticker: string): { isValid: boolean; message?: string } {
	if (!ticker || typeof ticker !== 'string') {
		return { isValid: false, message: 'Ticker must be a string' };
	}

	const cleaned = ticker.trim().toUpperCase();

	if (cleaned.length === 0) {
		return { isValid: false, message: 'Ticker cannot be empty' };
	}

	if (cleaned.length > 10) {
		return { isValid: false, message: 'Ticker must be 10 characters or less' };
	}

	// Basic pattern check (letters, numbers, dots, hyphens)
	if (!/^[A-Z0-9.-]+$/.test(cleaned)) {
		return { isValid: false, message: 'Ticker contains invalid characters' };
	}

	return { isValid: true };
}

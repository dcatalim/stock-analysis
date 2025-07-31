import type { PageServerLoad } from './$types';
import yahooFinance from 'yahoo-finance2';

export const load = (async ({ params }) => {
	const { ticker } = params;
	if (!ticker || typeof ticker !== 'string') {
		return { error: 'Valid ticker symbol is required' };
	}
	// Sanitize ticker (remove whitespace, convert to uppercase)
	const sanitizedTicker = ticker.trim().toUpperCase();
	if (sanitizedTicker.length === 0 || sanitizedTicker.length > 10) {
		return { error: 'Ticker symbol must be 1-10 characters' };
	}
	// Fetch company breakdown data
	try {
		const response = await yahooFinance.quoteSummary(sanitizedTicker, {modules: ['quoteType','financialData', 'defaultKeyStatistics', 'assetProfile', "earnings", "earningsHistory", "earningsTrend", "calendarEvents"]});

		return { quote: response };
	} catch (error) {
		console.error('Load Error:', error);
		return { error: 'Failed to fetch company breakdown data' };
	}
	// Return empty object if no data or error
	// This is to satisfy the return type of PageServerLoad
	return {};
}) satisfies PageServerLoad;

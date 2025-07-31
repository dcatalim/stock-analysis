import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import yahooFinance from 'yahoo-finance2';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { tickers } = body;

		// Input validation
		if (!Array.isArray(tickers) || tickers.length === 0) {
			return json({ error: 'Valid ticker symbols are required' }, { status: 400 });
		}

		// Sanitize tickers (remove whitespace, convert to uppercase)
		const sanitizedTickers = tickers.map((ticker) => ticker.trim().toUpperCase());

		if (sanitizedTickers.some((ticker) => ticker.length === 0 || ticker.length > 10)) {
			return json({ error: 'Ticker symbols must be 1-10 characters' }, { status: 400 });
		}

		// Fetch quotes for all tickers
		const quotes = await Promise.all(sanitizedTickers.map((ticker) => yahooFinance.quote(ticker)));

		// Validate response
		if (!quotes || quotes.some((quote) => !quote.symbol)) {
			return json({ error: 'Stock not found or invalid ticker' }, { status: 404 });
		}

		return json(quotes);
	} catch (error) {
		console.error('API Error:', error);

		// Handle specific Yahoo Finance errors
		if ((error as any)?.message?.includes('Not found')) {
			return json({ error: 'Stock ticker not found' }, { status: 404 });
		}

		if ((error as any)?.message?.includes('rate limit')) {
			return json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
		}

		// Generic error
		return json({ error: 'Failed to fetch stock data' }, { status: 500 });
	}
};

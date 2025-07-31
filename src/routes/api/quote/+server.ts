import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import yahooFinance from 'yahoo-finance2';

export const POST: RequestHandler = async ( { request }) => {
    let { ticker } = await request.json();
    
    if (!ticker) {
        return json({ error: 'Ticker symbol is required' }, { status: 400 });
    }


	const quote = await yahooFinance.quote(ticker);

	console.log(quote);

	return json(quote);
};

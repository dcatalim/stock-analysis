<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card';
	import { onDestroy, onMount } from 'svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	interface SearchSnapshot {
		ticker: string;
		stockData: any | null;
		lastUpdated: number;
	}

	let searchInput = $state('');
	let ticker = $state('');
	let stockData = $state(null);
	let isLoading = $state(false);
	let error = $state('');
	let updateInterval: ReturnType<typeof setInterval> | null = $state(null);
	let copySuccess = $state(false);

	// Snapshot functions
	export const snapshot = {
		capture: (): SearchSnapshot => ({
			ticker,
			stockData,
			lastUpdated: Date.now()
		}),
		restore: (value: SearchSnapshot) => {
			if (value) {
				ticker = value.ticker || '';
				stockData = value.stockData || null;
				
				// If data is older than 5 minutes, refresh it
				const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
				if (value.lastUpdated < fiveMinutesAgo && stockData && ticker) {
					// Refresh data after a short delay to allow UI to render
					setTimeout(() => {
						updateStockData();
					}, 100);
				} else if (stockData && ticker) {
					// Start auto-update if we have data
					startAutoUpdate();
				}
			}
		}
	};

	// URL persistence functions
	function updateURL() {
		if (!browser) return;
		
		const url = new URL(window.location.href);
		if (ticker && stockData) {
			url.searchParams.set('ticker', ticker);
		} else {
			url.searchParams.delete('ticker');
		}
		goto(url.pathname + url.search, { replaceState: true, noScroll: true });
	}

	function loadFromURL() {
		if (!browser) return;
		
		const urlTicker = $page.url.searchParams.get('ticker');
		if (urlTicker) {
			const url_ticker = urlTicker.trim().toUpperCase();
			if (url_ticker && url_ticker.length <= 10) {
				ticker = url_ticker;
				searchInput = url_ticker;
				// Trigger search after a short delay to allow UI to render
				setTimeout(() => {
					const event = new Event('submit');
					handleSearch(event);
				}, 100);
			}
		}
	}

	// Initialize from URL on mount
	onMount(() => {
		loadFromURL();
	});

	async function handleSearch(event: Event) {
		event.preventDefault();


		const trimmedTicker = searchInput.trim();

		if (!trimmedTicker) {
			error = 'Please enter a ticker symbol';
			return;
		}

		if (trimmedTicker.length > 10) {
			error = 'Ticker symbol must be 10 characters or less';
			return;
		}

		ticker = trimmedTicker;
		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/quote', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ticker: trimmedTicker })
			});

			const responseData = await response.json();

			if (response.ok) {
				stockData = responseData;
				startAutoUpdate();
				updateURL();
			} else {
				error = responseData.error || 'Failed to fetch stock data';
				stopAutoUpdate();
				stockData = null;
			}
		} catch (err) {
			console.error('Fetch error:', err);
			error = 'Network error. Please check your connection and try again.';
			stopAutoUpdate();
			stockData = null;
		} finally {
			isLoading = false;
		}
	}

	async function updateStockData() {
		const trimmedTicker = ticker.trim();
		if (!trimmedTicker) return;

		try {
			const response = await fetch('/api/quote', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ticker: trimmedTicker })
			});

			const responseData = await response.json();

			if (response.ok) {
				stockData = responseData;
				// Clear any existing errors on successful update
				if (error) error = '';
			} else {
				// Don't show auto-update errors as prominently
				console.warn('Auto-update failed:', responseData.error);
				// Optionally show a less intrusive error
				if (responseData.error?.includes('rate limit')) {
					error = 'Rate limited - updates paused';
					stopAutoUpdate();
				}
			}
		} catch (err) {
			console.warn('Auto-update network error:', err);
			// Don't show network errors for auto-updates unless critical
		}
	}

	function startAutoUpdate() {
		stopAutoUpdate(); // Clear any existing interval
		updateInterval = setInterval(updateStockData, 5000); // Update every 5 seconds
	}

	function stopAutoUpdate() {
		if (updateInterval) {
			clearInterval(updateInterval);
			updateInterval = null;
		}
	}

	async function shareSearch() {
		if (!browser || !stockData || !ticker) return;
		
		try {
			const url = window.location.href;
			await navigator.clipboard.writeText(url);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy URL:', err);
		}
	}

	onDestroy(() => {
		stopAutoUpdate();
	});
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-2xl font-bold">Search Stock</h1>
	<p class="text-muted-foreground">Insert ticker to get the latest stock insights.</p>

	<!-- Subscription Form -->

	<form onsubmit={handleSearch} class="flex w-full max-w-sm items-center space-x-2">
		<Input
			type="text"
			placeholder="AAPL"
			bind:value={searchInput}
			disabled={isLoading}
			maxlength="10"
			class="uppercase"
		/>
		<Button type="submit" disabled={isLoading || !searchInput.trim()}>
			{isLoading ? 'Searching...' : 'Search'}
		</Button>
	</form>

	{#if isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else if stockData}
		<!-- Auto-update indicator -->
		<div class="flex w-full max-w-6xl items-center justify-between">
			<div class="text-sm text-muted-foreground">
				{#if updateInterval}
					🟢 Auto-updating every 5 seconds
				{:else}
					🔴 Auto-update stopped
				{/if}
			</div>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={updateInterval ? stopAutoUpdate : startAutoUpdate}
				>
					{updateInterval ? 'Stop Updates' : 'Start Updates'}
				</Button>
				<Button variant="outline" size="sm" onclick={() => updateStockData()}>Refresh Now</Button>
				<Button variant="outline" size="sm" onclick={shareSearch}>
					{copySuccess ? '✓ Copied!' : '🔗 Share'}
				</Button>
			</div>
		</div>

		<Card.Root class="w-full max-w-6xl">
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="text-xl">{stockData.shortName} ({stockData.symbol})</Card.Title>
						<Card.Description class="text-sm text-muted-foreground"
							>{stockData.fullExchangeName}</Card.Description
						>
					</div>
					<div class="text-right">
						<div class="text-2xl font-bold">${stockData.regularMarketPrice}</div>
						<div
							class="text-sm {stockData.regularMarketChange >= 0
								? 'text-green-600'
								: 'text-red-600'}"
						>
							{stockData.regularMarketChange >= 0 ? '+' : ''}{stockData.regularMarketChange.toFixed(
								2
							)}
							({stockData.regularMarketChangePercent >= 0
								? '+'
								: ''}{stockData.regularMarketChangePercent.toFixed(2)}%)
						</div>
					</div>
				</div>
				{#if stockData.preMarketPrice && stockData.marketState === 'PRE'}
					<div class="text-sm">
						<span class="text-muted-foreground">Pre-Market:</span>
						<span class="font-medium">${stockData.preMarketPrice}</span>
						<span class="ml-2 {stockData.preMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}">
							{stockData.preMarketChange >= 0 ? '+' : ''}{stockData.preMarketChange.toFixed(2)}
							({stockData.preMarketChangePercent >= 0
								? '+'
								: ''}{stockData.preMarketChangePercent.toFixed(2)}%)
						</span>
					</div>
				{/if}
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="text-sm text-muted-foreground">Day Range</div>
						<div class="font-medium">
							${stockData.regularMarketDayLow} - ${stockData.regularMarketDayHigh}
						</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">Volume</div>
						<div class="font-medium">{stockData.regularMarketVolume.toLocaleString()}</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">Market Cap</div>
						<div class="font-medium">${(stockData.marketCap / 1e12).toFixed(2)}T</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">P/E Ratio</div>
						<div class="font-medium">{stockData.trailingPE?.toFixed(2) || 'N/A'}</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">52W Range</div>
						<div class="font-medium">
							${stockData.fiftyTwoWeekLow} - ${stockData.fiftyTwoWeekHigh}
						</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">Dividend Yield</div>
						<div class="font-medium">
							{stockData.dividendYield ? stockData.dividendYield + '%' : 'N/A'}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Additional Financial Metrics Card -->
		<Card.Root class="w-full max-w-6xl">
			<Card.Header>
				<Card.Title class="text-lg">Financial Metrics</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- P/E Ratios Section -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">P/E Ratios</h3>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">TTM P/E</div>
							<div class="font-medium">{stockData.trailingPE?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Forward P/E</div>
							<div class="font-medium">{stockData.forwardPE?.toFixed(2) || 'N/A'}</div>
						</div>
					</div>
				</div>
				<Separator />

				<!-- EPS Growth Section -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">EPS Growth</h3>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">TTM EPS</div>
							<div class="font-medium">
								${stockData.epsTrailingTwelveMonths?.toFixed(2) || 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Current Year EPS</div>
							<div class="font-medium">${stockData.epsCurrentYear?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Forward EPS</div>
							<div class="font-medium">${stockData.epsForward?.toFixed(2) || 'N/A'}</div>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Ratios Section -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Key Ratios</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Price to Book</div>
							<div class="font-medium">{stockData.priceToBook?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Book Value</div>
							<div class="font-medium">${stockData.bookValue?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Price/EPS Current Year</div>
							<div class="font-medium">{stockData.priceEpsCurrentYear?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Shares Outstanding</div>
							<div class="font-medium">
								{stockData.sharesOutstanding
									? (stockData.sharesOutstanding / 1e9).toFixed(2) + 'B'
									: 'N/A'}
							</div>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Trading Information Card -->
		<Card.Root class="w-full max-w-6xl">
			<Card.Header>
				<Card.Title class="text-lg">Trading Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Current Trading Data -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Current Session</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Open</div>
							<div class="font-medium">${stockData.regularMarketOpen?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Previous Close</div>
							<div class="font-medium">
								${stockData.regularMarketPreviousClose?.toFixed(2) || 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Bid</div>
							<div class="font-medium">
								${stockData.bid?.toFixed(2) || 'N/A'} x {stockData.bidSize || 0}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Ask</div>
							<div class="font-medium">
								${stockData.ask?.toFixed(2) || 'N/A'} x {stockData.askSize || 0}
							</div>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Volume Data -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Volume</h3>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Today's Volume</div>
							<div class="font-medium">
								{stockData.regularMarketVolume?.toLocaleString() || 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Avg Vol (10 Day)</div>
							<div class="font-medium">
								{stockData.averageDailyVolume10Day?.toLocaleString() || 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Avg Vol (3 Month)</div>
							<div class="font-medium">
								{stockData.averageDailyVolume3Month?.toLocaleString() || 'N/A'}
							</div>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Moving Averages -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Moving Averages</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">50-Day Average</div>
							<div class="font-medium">${stockData.fiftyDayAverage?.toFixed(2) || 'N/A'}</div>
							<div
								class="text-xs {stockData.fiftyDayAverageChange >= 0
									? 'text-green-600'
									: 'text-red-600'}"
							>
								{stockData.fiftyDayAverageChange >= 0
									? '+'
									: ''}{stockData.fiftyDayAverageChange?.toFixed(2) || 'N/A'}
								({stockData.fiftyDayAverageChangePercent >= 0 ? '+' : ''}{(
									stockData.fiftyDayAverageChangePercent * 100
								).toFixed(2) || 'N/A'}%)
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">200-Day Average</div>
							<div class="font-medium">${stockData.twoHundredDayAverage?.toFixed(2) || 'N/A'}</div>
							<div
								class="text-xs {stockData.twoHundredDayAverageChange >= 0
									? 'text-green-600'
									: 'text-red-600'}"
							>
								{stockData.twoHundredDayAverageChange >= 0
									? '+'
									: ''}{stockData.twoHundredDayAverageChange?.toFixed(2) || 'N/A'}
								({stockData.twoHundredDayAverageChangePercent >= 0 ? '+' : ''}{(
									stockData.twoHundredDayAverageChangePercent * 100
								).toFixed(2) || 'N/A'}%)
							</div>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Dividend & Earnings Card -->
		<Card.Root class="w-full max-w-6xl">
			<Card.Header>
				<Card.Title class="text-lg">Dividends & Earnings</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Dividend Information -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Dividend Information</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Dividend Rate</div>
							<div class="font-medium">${stockData.dividendRate?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Dividend Yield</div>
							<div class="font-medium">
								{stockData.dividendYield ? stockData.dividendYield + '%' : 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">TTM Dividend Rate</div>
							<div class="font-medium">
								${stockData.trailingAnnualDividendRate?.toFixed(2) || 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">TTM Dividend Yield</div>
							<div class="font-medium">
								{stockData.trailingAnnualDividendYield
									? stockData.trailingAnnualDividendYield + '%'
									: 'N/A'}
							</div>
						</div>
					</div>
					{#if stockData.dividendDate}
						<div class="mt-2">
							<div class="text-xs text-muted-foreground">Ex-Dividend Date</div>
							<div class="font-medium">{new Date(stockData.dividendDate).toLocaleDateString()}</div>
						</div>
					{/if}
				</div>

				<Separator />

				<!-- Earnings Information -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Earnings</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Next Earnings Date</div>
							<div class="font-medium">
								{stockData.earningsTimestamp
									? new Date(stockData.earningsTimestamp).toLocaleDateString()
									: 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Is Estimate</div>
							<div class="font-medium">{stockData.isEarningsDateEstimate ? 'Yes' : 'No'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Earnings Start Time</div>
							<div class="font-medium">
								{stockData.earningsTimestampStart
									? new Date(stockData.earningsTimestampStart).toLocaleDateString()
									: 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Earnings End Time</div>
							<div class="font-medium">
								{stockData.earningsTimestampEnd
									? new Date(stockData.earningsTimestampEnd).toLocaleDateString()
									: 'N/A'}
							</div>
						</div>
					</div>
				</div>

				<!-- 52-Week Performance -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">52-Week Performance</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">52W Change</div>
							<div
								class="font-medium {stockData.fiftyTwoWeekChangePercent >= 0
									? 'text-green-600'
									: 'text-red-600'}"
							>
								{stockData.fiftyTwoWeekChangePercent >= 0 ? '+' : ''}{(
									stockData.fiftyTwoWeekChangePercent * 100
								).toFixed(2) || 'N/A'}%
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">From 52W High</div>
							<div class="font-medium text-red-600">
								{stockData.fiftyTwoWeekHighChange?.toFixed(2) || 'N/A'} ({(
									stockData.fiftyTwoWeekHighChangePercent * 100
								).toFixed(2) || 'N/A'}%)
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">From 52W Low</div>
							<div class="font-medium text-green-600">
								{stockData.fiftyTwoWeekLowChange?.toFixed(2) || 'N/A'} ({(
									stockData.fiftyTwoWeekLowChangePercent * 100
								).toFixed(2) || 'N/A'}%)
							</div>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Company & Market Info Card -->
		<Card.Root class="w-full max-w-6xl">
			<Card.Header>
				<Card.Title class="text-lg">Company & Market Info</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Company Details -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Company Information</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Full Name</div>
							<div class="font-medium">{stockData.longName || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Display Name</div>
							<div class="font-medium">{stockData.displayName || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Quote Type</div>
							<div class="font-medium">{stockData.typeDisp || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Currency</div>
							<div class="font-medium">{stockData.currency || 'N/A'}</div>
						</div>
					</div>
				</div>

				<!-- Market Information -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Market Information</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Market State</div>
							<div class="font-medium">{stockData.marketState || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Exchange</div>
							<div class="font-medium">{stockData.fullExchangeName || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Exchange Code</div>
							<div class="font-medium">{stockData.exchange || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Timezone</div>
							<div class="font-medium">{stockData.exchangeTimezoneShortName || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Full Timezone</div>
							<div class="font-medium">{stockData.exchangeTimezoneName || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">First Trade Date</div>
							<div class="font-medium">
								{stockData.firstTradeDateMilliseconds
									? new Date(stockData.firstTradeDateMilliseconds).toLocaleDateString()
									: 'N/A'}
							</div>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Market Timing Information -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Market Timing</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Regular Market Time</div>
							<div class="font-medium">
								{stockData.regularMarketTime
									? new Date(stockData.regularMarketTime).toLocaleString()
									: 'N/A'}
							</div>
						</div>
						{#if stockData.preMarketTime}
							<div>
								<div class="text-xs text-muted-foreground">Pre-Market Time</div>
								<div class="font-medium">
									{new Date(stockData.preMarketTime).toLocaleString()}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<Separator />

				<!-- Data Source Information -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Data Source</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Quote Source</div>
							<div class="font-medium">{stockData.quoteSourceName || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Data Delay</div>
							<div class="font-medium">{stockData.exchangeDataDelayedBy || 0} minutes</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Region</div>
							<div class="font-medium">{stockData.region || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Language</div>
							<div class="font-medium">{stockData.language || 'N/A'}</div>
						</div>
					</div>
				</div>

				<!-- Analyst Rating -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Analyst Information</h3>
					<div>
						<div class="text-xs text-muted-foreground">Average Analyst Rating</div>
						<div class="text-lg font-medium">{stockData.averageAnalystRating || 'N/A'}</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Technical & Additional Data Card -->
		<Card.Root class="w-full max-w-6xl">
			<Card.Header>
				<Card.Title class="text-lg">Technical & Additional Information</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Trading Status -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Trading Status</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Tradeable</div>
							<div class="font-medium">{stockData.tradeable ? 'Yes' : 'No'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Crypto Tradeable</div>
							<div class="font-medium">{stockData.cryptoTradeable ? 'Yes' : 'No'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Triggerable</div>
							<div class="font-medium">{stockData.triggerable ? 'Yes' : 'No'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Has Pre/Post Market Data</div>
							<div class="font-medium">{stockData.hasPrePostMarketData ? 'Yes' : 'No'}</div>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Price Alerts & Confidence -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Price Alert Information</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Price Alert Confidence</div>
							<div class="font-medium">{stockData.customPriceAlertConfidence || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Price Hint</div>
							<div class="font-medium">{stockData.priceHint || 'N/A'}</div>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Financial Currency & Source -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">Financial Information</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Financial Currency</div>
							<div class="font-medium">{stockData.financialCurrency || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Source Interval</div>
							<div class="font-medium">{stockData.sourceInterval || 'N/A'} seconds</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">GMT Offset</div>
							<div class="font-medium">
								{stockData.gmtOffSetMilliseconds
									? (stockData.gmtOffSetMilliseconds / 3600000).toFixed(0) + ' hours'
									: 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Market</div>
							<div class="font-medium">{stockData.market || 'N/A'}</div>
						</div>
					</div>
				</div>

				<Separator />

				<!-- ESG & Corporate Actions -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-muted-foreground">ESG & Corporate Actions</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">ESG Populated</div>
							<div class="font-medium">{stockData.esgPopulated ? 'Yes' : 'No'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Corporate Actions</div>
							<div class="font-medium">
								{stockData.corporateActions && stockData.corporateActions.length > 0
									? stockData.corporateActions.length + ' action(s)'
									: 'None'}
							</div>
						</div>
						{#if stockData.messageBoardId}
							<div>
								<div class="text-xs text-muted-foreground">Message Board ID</div>
								<div class="font-medium">{stockData.messageBoardId}</div>
							</div>
						{/if}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

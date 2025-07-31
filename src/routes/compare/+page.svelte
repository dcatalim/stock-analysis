<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { onDestroy, onMount } from 'svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	interface CompareSnapshot {
		tickers: string[];
		stocksData: any[];
		lastUpdated: number;
	}

	let newTicker = $state('');
	let tickers = $state<string[]>([]);
	let stocksData = $state<any[]>([]);
	let isLoading = $state(false);
	let error = $state('');
	let updateInterval: ReturnType<typeof setInterval> | null = $state(null);
	let copySuccess = $state(false);

	// Snapshot functions
	export const snapshot = {
		capture: (): CompareSnapshot => ({
			tickers,
			stocksData,
			lastUpdated: Date.now()
		}),
		restore: (value: CompareSnapshot) => {
			if (value) {
				tickers = value.tickers || [];
				stocksData = value.stocksData || [];

				// If data is older than 5 minutes, refresh it
				const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
				if (value.lastUpdated < fiveMinutesAgo && tickers.length > 0) {
					// Refresh data after a short delay to allow UI to render
					setTimeout(() => {
						fetchStocksData();
					}, 100);
				} else if (tickers.length > 0) {
					// Start auto-update if we have tickers
					startAutoUpdate();
				}
			}
		}
	};

	// URL persistence functions
	function updateURL() {
		if (!browser) return;
		
		const url = new URL(window.location.href);
		if (tickers.length > 0) {
			url.searchParams.set('tickers', tickers.join(','));
		} else {
			url.searchParams.delete('tickers');
		}
		goto(url.pathname + url.search, { replaceState: true, noScroll: true });
	}

	function loadFromURL() {
		if (!browser) return;
		
		const urlTickers = page.url.searchParams.get('tickers');
		if (urlTickers) {
			const tickerList = urlTickers.split(',')
				.map(t => t.trim().toUpperCase())
				.filter(t => t && t.length <= 10)
				.slice(0, 5); // Max 5 tickers
			
			if (tickerList.length > 0) {
				tickers = tickerList;
				fetchStocksData();
			}
		}
	}

	// Initialize from URL on mount
	onMount(() => {
		loadFromURL();
	});

	async function addTicker(event: Event) {
		event.preventDefault();

		const trimmedTicker = newTicker.trim().toUpperCase();
		if (!trimmedTicker) {
			error = 'Please enter a ticker symbol';
			return;
		}

		if (trimmedTicker.length > 10) {
			error = 'Ticker symbol must be 10 characters or less';
			return;
		}

		if (tickers.includes(trimmedTicker)) {
			// error = 'Ticker already added';
            newTicker = '';
			return;
		}

		if (tickers.length >= 5) {
			error = 'Maximum 5 tickers allowed';
			return;
		}

		tickers = [...tickers, trimmedTicker];
		newTicker = '';
		error = '';

		await fetchStocksData();
		updateURL();
	}

	function removeTicker(tickerToRemove: string) {
		tickers = tickers.filter((ticker) => ticker !== tickerToRemove);
		if (tickers.length === 0) {
			stocksData = [];
			stopAutoUpdate();
		} else {
			fetchStocksData();
		}
		updateURL();
	}

	async function fetchStocksData() {
		if (tickers.length === 0) {
			stocksData = [];
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/quotes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ tickers })
			});

			const responseData = await response.json();

			if (response.ok) {
				// Handle both single and multiple stock responses
				if (Array.isArray(responseData)) {
					stocksData = responseData;
				} else {
					stocksData = [responseData];
				}
				startAutoUpdate();
			} else {
				error = responseData.error || 'Failed to fetch stock data';
				stopAutoUpdate();
				stocksData = [];
			}
		} catch (err) {
			console.error('Fetch error:', err);
			error = 'Network error. Please check your connection and try again.';
			stopAutoUpdate();
			stocksData = [];
		} finally {
			isLoading = false;
		}
	}

	async function updateStocksData() {
		if (tickers.length === 0) return;

		try {
			const response = await fetch('/api/quotes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ tickers })
			});

			const responseData = await response.json();

			if (response.ok) {
				// Handle both single and multiple stock responses
				if (Array.isArray(responseData)) {
					stocksData = responseData;
				} else {
					stocksData = [responseData];
				}
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
		updateInterval = setInterval(updateStocksData, 10000); // Update every 10 seconds (longer than single search)
	}

	function stopAutoUpdate() {
		if (updateInterval) {
			clearInterval(updateInterval);
			updateInterval = null;
		}
	}

	function clearAllTickers() {
		tickers = [];
		stocksData = [];
		stopAutoUpdate();
		error = '';
		updateURL();
	}

	async function shareComparison() {
		if (!browser || tickers.length === 0) return;
		
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
	<h1 class="text-2xl font-bold">Compare Stocks</h1>
	<p class="text-muted-foreground">Add multiple tickers to compare stocks side by side.</p>

	<!-- Add Ticker Form -->
	<form onsubmit={addTicker} class="flex w-full max-w-sm items-center space-x-2">
		<Input
			type="text"
			placeholder="AAPL"
			bind:value={newTicker}
			disabled={isLoading}
			maxlength="10"
			class="uppercase"
		/>
		<Button type="submit" disabled={isLoading || !newTicker.trim() || tickers.length >= 5}>
			{isLoading ? 'Adding...' : 'Add'}
		</Button>
	</form>

	<!-- Current Tickers -->
	{#if tickers.length > 0}
		<div class="flex w-full max-w-6xl flex-wrap items-center justify-center gap-2">
			<span class="text-sm text-muted-foreground">Comparing:</span>
			{#each tickers as ticker}
				<Badge variant="secondary" class="flex items-center gap-1">
					{ticker}
					<button
						onclick={() => removeTicker(ticker)}
						class="ml-1 text-xs hover:text-red-500"
						disabled={isLoading}
					>
						×
					</button>
				</Badge>
			{/each}
			<Button variant="outline" size="sm" onclick={clearAllTickers} disabled={isLoading}>
				Clear All
			</Button>
			<Button variant="outline" size="sm" onclick={shareComparison} disabled={isLoading}>
				{copySuccess ? '✓ Copied!' : '🔗 Share'}
			</Button>
		</div>
	{/if}

	{#if isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else if stocksData.length > 0}
		<!-- Auto-update controls -->
		<div class="flex w-full max-w-7xl items-center justify-between">
			<div class="text-sm text-muted-foreground">
				{#if updateInterval}
					🟢 Auto-updating every 10 seconds
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
				<Button variant="outline" size="sm" onclick={() => updateStocksData()}>Refresh Now</Button>
			</div>
		</div>

		<!-- Comparison Grid -->
		<div
			class="grid w-full max-w-7xl gap-4 {stocksData.length === 1
				? 'grid-cols-1'
				: stocksData.length === 2
					? 'grid-cols-1 md:grid-cols-2'
					: stocksData.length === 3
						? 'grid-cols-1 md:grid-cols-3'
						: stocksData.length === 4
							? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
							: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5'}"
		>
			{#each stocksData as stock}
				<Card.Root class="w-full">
					<Card.Header>
						<div class="flex items-center justify-between">
							<div>
								<Card.Title class="text-lg">{stock.shortName} ({stock.symbol})</Card.Title>
								<Card.Description class="text-xs text-muted-foreground"
									>{stock.fullExchangeName}</Card.Description
								>
							</div>
							<button
								onclick={() => removeTicker(stock.symbol)}
								class="text-xs text-muted-foreground hover:text-red-500"
								disabled={isLoading}
							>
								×
							</button>
						</div>
						<div class="text-right">
							<div class="text-xl font-bold">${stock.regularMarketPrice}</div>
							<div
								class="text-sm {stock.regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}"
							>
								{stock.regularMarketChange >= 0 ? '+' : ''}{stock.regularMarketChange.toFixed(2)}
								({stock.regularMarketChangePercent >= 0
									? '+'
									: ''}{stock.regularMarketChangePercent.toFixed(2)}%)
							</div>
						</div>
						{#if stock.preMarketPrice && stock.marketState === 'PRE'}
							<div class="text-xs">
								<span class="text-muted-foreground">Pre-Market:</span>
								<span class="font-medium">${stock.preMarketPrice}</span>
								<span class="ml-1 {stock.preMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}">
									{stock.preMarketChange >= 0 ? '+' : ''}{stock.preMarketChange.toFixed(2)}
									({stock.preMarketChangePercent >= 0
										? '+'
										: ''}{stock.preMarketChangePercent.toFixed(2)}%)
								</span>
							</div>
						{/if}
					</Card.Header>
					<Card.Content class="space-y-3">
						<!-- Key Metrics -->
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div>
								<div class="text-muted-foreground">Day Range</div>
								<div class="font-medium">
									${stock.regularMarketDayLow} - ${stock.regularMarketDayHigh}
								</div>
							</div>
							<div>
								<div class="text-muted-foreground">Volume</div>
								<div class="font-medium">{stock.regularMarketVolume.toLocaleString()}</div>
							</div>
							<div>
								<div class="text-muted-foreground">Market Cap</div>
								<div class="font-medium">${(stock.marketCap / 1e12).toFixed(2)}T</div>
							</div>
							<div>
								<div class="text-muted-foreground">P/E Ratio</div>
								<div class="font-medium">{stock.trailingPE?.toFixed(2) || 'N/A'}</div>
							</div>
							<div>
								<div class="text-muted-foreground">52W Range</div>
								<div class="font-medium">
									${stock.fiftyTwoWeekLow} - ${stock.fiftyTwoWeekHigh}
								</div>
							</div>
							<div>
								<div class="text-muted-foreground">Dividend Yield</div>
								<div class="font-medium">
									{stock.dividendYield ? stock.dividendYield + '%' : 'N/A'}
								</div>
							</div>
						</div>

						<Separator />

						<!-- Performance Metrics -->
						<div class="space-y-2 text-xs">
							<div class="font-medium text-muted-foreground">Performance</div>
							<div class="flex justify-between">
								<span>52W Change:</span>
								<span
									class={stock.fiftyTwoWeekChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}
								>
									{stock.fiftyTwoWeekChangePercent >= 0
										? '+'
										: ''}{stock.fiftyTwoWeekChangePercent.toFixed(2)}%
								</span>
							</div>
							<div class="flex justify-between">
								<span>50D Avg:</span>
								<span>${stock.fiftyDayAverage?.toFixed(2) || 'N/A'}</span>
							</div>
							<div class="flex justify-between">
								<span>200D Avg:</span>
								<span>${stock.twoHundredDayAverage?.toFixed(2) || 'N/A'}</span>
							</div>
						</div>

						<Separator />

						<!-- Financial Metrics -->
						<div class="space-y-2 text-xs">
							<div class="font-medium text-muted-foreground">Financial</div>
							<div class="flex justify-between">
								<span>EPS (TTM):</span>
								<span>${stock.epsTrailingTwelveMonths?.toFixed(2) || 'N/A'}</span>
							</div>
							<div class="flex justify-between">
								<span>Price/Book:</span>
								<span>{stock.priceToBook?.toFixed(2) || 'N/A'}</span>
							</div>
							<div class="flex justify-between">
								<span>Book Value:</span>
								<span>${stock.bookValue?.toFixed(2) || 'N/A'}</span>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Detailed Comparison Table -->
		{#if stocksData.length > 1}
			<Card.Root class="w-full max-w-7xl">
				<Card.Header>
					<Card.Title class="text-lg">Detailed Comparison</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b">
									<th class="p-2 text-left font-medium">Metric</th>
									{#each stocksData as stock}
										<th class="p-2 text-center font-medium">{stock.symbol}</th>
									{/each}
								</tr>
							</thead>
							<tbody class="text-xs">
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">Current Price</td>
									{#each stocksData as stock}
										<td class="p-2 text-center">${stock.regularMarketPrice}</td>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">Day Change %</td>
									{#each stocksData as stock}
										<td
											class="p-2 text-center {stock.regularMarketChangePercent >= 0
												? 'text-green-600'
												: 'text-red-600'}"
										>
											{stock.regularMarketChangePercent >= 0
												? '+'
												: ''}{stock.regularMarketChangePercent.toFixed(2)}%
										</td>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">Market Cap (T)</td>
									{#each stocksData as stock}
										<td class="p-2 text-center">${(stock.marketCap / 1e12).toFixed(2)}T</td>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">P/E Ratio</td>
									{#each stocksData as stock}
										<td class="p-2 text-center">{stock.trailingPE?.toFixed(2) || 'N/A'}</td>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">Dividend Yield</td>
									{#each stocksData as stock}
										<td class="p-2 text-center"
											>{stock.dividendYield ? stock.dividendYield + '%' : 'N/A'}</td
										>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">52W Change %</td>
									{#each stocksData as stock}
										<td
											class="p-2 text-center {stock.fiftyTwoWeekChangePercent >= 0
												? 'text-green-600'
												: 'text-red-600'}"
										>
											{stock.fiftyTwoWeekChangePercent >= 0
												? '+'
												: ''}{stock.fiftyTwoWeekChangePercent.toFixed(2)}%
										</td>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">Volume</td>
									{#each stocksData as stock}
										<td class="p-2 text-center">{stock.regularMarketVolume.toLocaleString()}</td>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">50D Average</td>
									{#each stocksData as stock}
										<td class="p-2 text-center">${stock.fiftyDayAverage?.toFixed(2) || 'N/A'}</td>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">200D Average</td>
									{#each stocksData as stock}
										<td class="p-2 text-center"
											>${stock.twoHundredDayAverage?.toFixed(2) || 'N/A'}</td
										>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">EPS (TTM)</td>
									{#each stocksData as stock}
										<td class="p-2 text-center"
											>${stock.epsTrailingTwelveMonths?.toFixed(2) || 'N/A'}</td
										>
									{/each}
								</tr>
								<tr class="border-b">
									<td class="p-2 font-medium text-muted-foreground">Price/Book</td>
									{#each stocksData as stock}
										<td class="p-2 text-center">{stock.priceToBook?.toFixed(2) || 'N/A'}</td>
									{/each}
								</tr>
								<tr>
									<td class="p-2 font-medium text-muted-foreground">Book Value</td>
									{#each stocksData as stock}
										<td class="p-2 text-center">${stock.bookValue?.toFixed(2) || 'N/A'}</td>
									{/each}
								</tr>
							</tbody>
						</table>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>

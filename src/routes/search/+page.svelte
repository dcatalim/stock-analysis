<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let searchTicker = $state('AAPL');
	let stockData = $state();
	let isLoading = $state(false);
	let error = $state('');

	async function handleSearch(event: Event) {
		event.preventDefault();
		if (!searchTicker.trim()) return;

		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/quote', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ticker: searchTicker.toUpperCase() })
			});

			if (response.ok) {
				const data = await response.json();
				stockData = data;
				console.log('Stock Data:', stockData);
			} else {
				error = 'Failed to fetch stock data';
			}
		} catch (err) {
			error = 'Failed to fetch stock data';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		handleSearch({ preventDefault: () => {} } as Event);
	});
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-2xl font-bold">Search Stock</h1>
	<p class="text-muted-foreground">Insert ticker to get the latest stock insights.</p>

	<!-- Subscription Form -->

	<form onsubmit={handleSearch} class="flex w-full max-w-sm items-center space-x-2">
		<Input type="text" placeholder="AAPL" bind:value={searchTicker} />
		<Button type="submit">Search</Button>
	</form>

	{#if isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else if stockData}
		<Card.Root class="w-full max-w-2xl">
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="text-xl">{stockData.shortName} ({stockData.symbol})</Card.Title>
						<Card.Description class="text-sm text-muted-foreground">{stockData.fullExchangeName}</Card.Description>
					</div>
					<div class="text-right">
						<div class="text-2xl font-bold">${stockData.regularMarketPrice}</div>
						<div class="text-sm {stockData.regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}">
							{stockData.regularMarketChange >= 0 ? '+' : ''}{stockData.regularMarketChange.toFixed(2)} 
							({stockData.regularMarketChangePercent >= 0 ? '+' : ''}{stockData.regularMarketChangePercent.toFixed(2)}%)
						</div>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="text-sm text-muted-foreground">Day Range</div>
						<div class="font-medium">${stockData.regularMarketDayLow} - ${stockData.regularMarketDayHigh}</div>
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
						<div class="font-medium">${stockData.fiftyTwoWeekLow} - ${stockData.fiftyTwoWeekHigh}</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">Dividend Yield</div>
						<div class="font-medium">{stockData.dividendYield ? (stockData.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</div>
					</div>
				</div>
			</Card.Content>
			{#if stockData.preMarketPrice && stockData.marketState === 'PRE'}
				<Card.Footer class="bg-muted/50">
					<div class="text-sm">
						<span class="text-muted-foreground">Pre-Market:</span>
						<span class="font-medium">${stockData.preMarketPrice}</span>
						<span class="ml-2 {stockData.preMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}">
							{stockData.preMarketChange >= 0 ? '+' : ''}{stockData.preMarketChange.toFixed(2)} 
							({stockData.preMarketChangePercent >= 0 ? '+' : ''}{stockData.preMarketChangePercent.toFixed(2)}%)
						</span>
					</div>
				</Card.Footer>
			{/if}
		</Card.Root>

		<!-- Additional Financial Metrics Card -->
		<Card.Root class="w-full max-w-2xl">
			<Card.Header>
				<Card.Title class="text-lg">Financial Metrics</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- P/E Ratios Section -->
				<div>
					<h3 class="text-sm font-semibold text-muted-foreground mb-3">P/E Ratios</h3>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">TTM P/E</div>
							<div class="font-medium">{stockData.trailingPE?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Forward P/E</div>
							<div class="font-medium">{stockData.forwardPE?.toFixed(2) || 'N/A'}</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">2Y Forward P/E</div>
							<div class="font-medium">N/A</div>
						</div>
					</div>
				</div>

				<!-- EPS Growth Section -->
				<div>
					<h3 class="text-sm font-semibold text-muted-foreground mb-3">EPS Growth</h3>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">TTM EPS</div>
							<div class="font-medium">${stockData.epsTrailingTwelveMonths?.toFixed(2) || 'N/A'}</div>
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

				<!-- Revenue Growth Section -->
				<div>
					<h3 class="text-sm font-semibold text-muted-foreground mb-3">Revenue Growth</h3>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">TTM Rev Growth</div>
							<div class="font-medium">N/A</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Current Yr Rev Growth</div>
							<div class="font-medium">N/A</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Next Yr Rev Growth</div>
							<div class="font-medium">N/A</div>
						</div>
					</div>
				</div>

				<!-- Margins & Ratios Section -->
				<div>
					<h3 class="text-sm font-semibold text-muted-foreground mb-3">Margins & Ratios</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Gross Margin</div>
							<div class="font-medium">N/A</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Net Margin</div>
							<div class="font-medium">N/A</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">TTM P/S Ratio</div>
							<div class="font-medium">N/A</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Forward P/S Ratio</div>
							<div class="font-medium">N/A</div>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

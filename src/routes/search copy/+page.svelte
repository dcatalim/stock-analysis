<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Search } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// State management
	let searchTicker = $state('');
	let isLoading = $state(false);
	let stockData = $state(null);
	let error = $state('');

	// Mock data for demonstration (replace with actual API call)
	const mockStockData = {
		symbol: 'META',
		price: 494.78,
		marketCap: '1.26T',
		metrics: {
			ttmPE: 27.43,
			forwardPE: 24.49,
			twoYearForwardPE: 20.29,
			ttmEPSGrowth: null,
			currentYearEPSGrowth: 37.92,
			nextYearEPSGrowth: 13.59,
			ttmRevGrowth: 21.62,
			currentYearRevGrowth: 19.45,
			nextYearRevGrowth: 14.53,
			grossMargin: 81.84,
			netMargin: 33.93,
			ttmPSRatio: 8.79,
			forwardPSRatio: 7.84
		},
		comparisons: {
			peRanges: {
				'20-28': 'MANY STOCKS TRADE AT 20-28',
				'18-26': 'MANY STOCKS TRADE AT 18-26',
				'16-24': 'MANY STOCKS TRADE AT 16-24'
			},
			growthRanges: {
				'8-12%': 'MANY STOCKS TRADE AT 8-12%'
			},
			revGrowthRanges: {
				'4.5-6.5%': 'MANY STOCKS TRADE AT 4.5-6.5%'
			},
			marginRanges: {
				'40-49%': 'MANY STOCKS TRADE AT 40-49%',
				'8-10%': 'MANY STOCKS TRADE AT 8-10%'
			},
			ratioRanges: {
				'1.8-2.6': 'MANY STOCKS TRADE AT 1.8-2.6'
			}
		}
	};

	async function handleSearch(event: Event) {
		event.preventDefault();
		if (!searchTicker.trim()) return;

		isLoading = true;
		error = '';

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			stockData = { ...mockStockData, symbol: searchTicker.toUpperCase() };
		} catch (err) {
			error = 'Failed to fetch stock data';
		} finally {
			isLoading = false;
		}
	}

	function getMetricColor(value: number | null, type: 'pe' | 'growth' | 'margin' | 'ratio'): string {
		if (value === null) return 'text-gray-400';
		
		switch (type) {
			case 'pe':
				return value < 20 ? 'text-green-400' : value < 30 ? 'text-yellow-400' : 'text-red-400';
			case 'growth':
				return value > 20 ? 'text-green-400' : value > 10 ? 'text-yellow-400' : 'text-red-400';
			case 'margin':
				return value > 30 ? 'text-green-400' : value > 15 ? 'text-yellow-400' : 'text-red-400';
			case 'ratio':
				return value < 5 ? 'text-green-400' : value < 10 ? 'text-yellow-400' : 'text-red-400';
			default:
				return 'text-gray-400';
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="flex items-center justify-center mb-4">
				<div class="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-lg">
					<span class="text-black font-bold text-xl">1000X STOCKS</span>
				</div>
			</div>
			<h1 class="text-4xl font-bold mb-2">WELCOME ADMIN!</h1>
			<div class="flex items-center justify-center space-x-6 text-sm">
				<span class="hover:text-yellow-400 cursor-pointer">SEARCH</span>
				<span class="hover:text-yellow-400 cursor-pointer">COMPARE</span>
				<span class="hover:text-yellow-400 cursor-pointer">EARNINGS CALLS</span>
				<span class="hover:text-yellow-400 cursor-pointer">ABOUT US</span>
				<span class="hover:text-yellow-400 cursor-pointer">METRICS</span>
				<Button variant="outline" size="sm" class="ml-4">ADMIN</Button>
			</div>
		</div>

		<!-- Search Section -->
		<div class="text-center mb-8">
			<form on:submit={handleSearch} class="flex items-center justify-center max-w-md mx-auto">
				<div class="relative flex-1">
					<Input
						bind:value={searchTicker}
						type="text"
						placeholder="SEARCH STOCK"
						class="bg-gradient-to-r from-yellow-400 to-orange-500 text-black placeholder-black/70 border-0 rounded-l-full pr-12 h-12 text-center font-semibold"
						disabled={isLoading}
					/>
					<Button
						type="submit"
						size="icon"
						class="absolute right-0 top-0 h-12 w-12 rounded-r-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 border-0"
						disabled={isLoading}
					>
						<Search class="h-4 w-4 text-black" />
					</Button>
				</div>
			</form>
		</div>

		{#if error}
			<div class="text-center text-red-400 mb-8">
				{error}
			</div>
		{/if}

		{#if isLoading}
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
			</div>
		{/if}

		{#if stockData}
			<!-- Stock Info Header -->
			<div class="text-center mb-8">
				<h2 class="text-5xl font-bold text-yellow-400 mb-2">{stockData.symbol}</h2>
				<p class="text-xl">STOCK PRICE: <span class="text-green-400">${stockData.price}</span> | MKT.CAP <span class="text-green-400">{stockData.marketCap}</span></p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Mandatory Metrics -->
				<Card class="bg-gray-800/50 border-gray-700">
					<CardHeader>
						<CardTitle class="text-yellow-400 text-lg">MANDATORY METRICS</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- P/E Ratios -->
						<div class="space-y-3">
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">TTM PE</span>
								<span class="text-yellow-400 font-bold text-xl">{stockData.metrics.ttmPE}</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.peRanges['20-28']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">FORWARD PE</span>
								<span class="text-yellow-400 font-bold text-xl">{stockData.metrics.forwardPE}</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.peRanges['18-26']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">2 YEAR FORWARD PE</span>
								<span class="text-yellow-400 font-bold text-xl">{stockData.metrics.twoYearForwardPE}</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.peRanges['16-24']}</span>
							</div>
						</div>

						<Separator class="bg-gray-600" />

						<!-- EPS Growth -->
						<div class="space-y-3">
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">TTM EPS GROWTH</span>
								<span class="text-gray-400 font-bold text-xl">-</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.growthRanges['8-12%']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">CURRENT YR EXP EPS GROWTH</span>
								<span class="text-green-400 font-bold text-xl">{stockData.metrics.currentYearEPSGrowth}%</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.growthRanges['8-12%']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">NEXT YEAR EPS GROWTH</span>
								<span class="text-yellow-400 font-bold text-xl">{stockData.metrics.nextYearEPSGrowth}%</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.growthRanges['8-12%']}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Revenue Growth & Other Metrics -->
				<div class="space-y-6">
					<!-- Revenue Growth -->
					<Card class="bg-gray-800/50 border-gray-700">
						<CardContent class="pt-6 space-y-3">
							<div class="flex justify-between items-center">
								<span class="bg-blue-600 px-3 py-1 rounded text-sm">TTM REV GROWTH</span>
								<span class="text-green-400 font-bold text-xl">{stockData.metrics.ttmRevGrowth}%</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.revGrowthRanges['4.5-6.5%']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-blue-600 px-3 py-1 rounded text-sm">CURRENT YR EXP REV GROWTH</span>
								<span class="text-green-400 font-bold text-xl">{stockData.metrics.currentYearRevGrowth}%</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.revGrowthRanges['4.5-6.5%']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-blue-600 px-3 py-1 rounded text-sm">NEXT YEAR REV GROWTH</span>
								<span class="text-yellow-400 font-bold text-xl">{stockData.metrics.nextYearRevGrowth}%</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.revGrowthRanges['4.5-6.5%']}</span>
							</div>
						</CardContent>
					</Card>

					<!-- Margins & Ratios -->
					<Card class="bg-gray-800/50 border-gray-700">
						<CardContent class="pt-6 space-y-3">
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">GROSS MARGIN</span>
								<span class="text-green-400 font-bold text-xl">{stockData.metrics.grossMargin}%</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.marginRanges['40-49%']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">NET MARGIN</span>
								<span class="text-green-400 font-bold text-xl">{stockData.metrics.netMargin}%</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.marginRanges['8-10%']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">TTM P/S RATIO</span>
								<span class="text-yellow-400 font-bold text-xl">{stockData.metrics.ttmPSRatio}</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.ratioRanges['1.8-2.6']}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="bg-gray-700 px-3 py-1 rounded text-sm">FORWARD P/S RATIO</span>
								<span class="text-yellow-400 font-bold text-xl">{stockData.metrics.forwardPSRatio}</span>
								<span class="text-gray-400 text-sm">{stockData.comparisons.ratioRanges['1.8-2.6']}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<!-- Call to Action -->
			<div class="text-center mt-8">
				<div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-lg inline-block">
					<span class="text-2xl font-bold">GET THE MOST IMPORTANT METRICS</span>
				</div>
			</div>
		{/if}
	</div>
</div>

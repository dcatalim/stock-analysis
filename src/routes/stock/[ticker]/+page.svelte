<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { formatCurrency, formatLargeNumber, formatPercentage, formatNumber } from '$lib/utils/formatters';
	import { ExternalLink, Globe, MapPin, Phone, Building, Users, TrendingUp, TrendingDown } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const stockData = data.quote;
	console.log('Company Page Data:', stockData);

	if (!stockData) {
		throw new Error('No stock data available');
	}
	const company = stockData.quoteType; 
	const profile = stockData.assetProfile;
	const keyStats = stockData.defaultKeyStatistics;
	const financials = stockData.financialData;

	// Helper function to get risk level color
	function getRiskColor(risk: number): string {
		if (risk <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
		if (risk <= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
		return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
	}

	// Helper function to get recommendation color
	function getRecommendationColor(rec: string): string {
		switch (rec.toLowerCase()) {
			case 'buy':
			case 'strong buy':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'hold':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			case 'sell':
			case 'strong sell':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
		}
	}
</script>

<div class="container mx-auto space-y-6">
	<!-- Company Header -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-start justify-between">
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<Card.Title class="text-3xl">{company?.longName || 'N/A'}</Card.Title>
						<Badge variant="secondary">{profile?.sector || 'N/A'}</Badge>
						<Badge variant="outline">{company?.symbol || 'N/A'}</Badge>
					</div>
					<div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
						<span>{company?.shortName || 'N/A'}</span>
						<span>•</span>
						<span>{company?.exchange || 'N/A'}</span>
						<span>•</span>
						<span>{company?.quoteType || 'N/A'}</span>
					</div>
					<div class="flex items-center gap-4 text-sm text-muted-foreground">
						{#if profile?.address1}
							<div class="flex items-center gap-1">
								<MapPin class="h-4 w-4" />
								{profile.address1}, {profile.city}, {profile.state} {profile.zip}
							</div>
						{/if}
						{#if profile?.phone}
							<div class="flex items-center gap-1">
								<Phone class="h-4 w-4" />
								{profile.phone}
							</div>
						{/if}
					</div>
				</div>
				<div class="text-right space-y-1">
					<div class="text-3xl font-bold">{formatCurrency(financials?.currentPrice)}</div>
					<Badge class={getRecommendationColor(financials?.recommendationKey || '')}>
						{financials?.recommendationKey?.toUpperCase() || 'N/A'}
					</Badge>
				</div>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center gap-4">
				{#if profile?.website}
					<Button variant="outline" size="sm" onclick={() => window.open(profile.website, '_blank')}>
						<Globe class="h-4 w-4 mr-2" />
						Website
						<ExternalLink class="h-3 w-3 ml-1" />
					</Button>
				{/if}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Users class="h-4 w-4" />
					{formatLargeNumber(profile?.fullTimeEmployees)} employees
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Key Metrics Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="text-sm font-medium">Market Cap</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatLargeNumber(keyStats?.enterpriseValue)}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="text-sm font-medium">P/E Ratio</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatNumber(keyStats?.forwardPE)}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="text-sm font-medium">Revenue (TTM)</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatLargeNumber(financials?.totalRevenue)}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="text-sm font-medium">Profit Margin</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold flex items-center">
					{formatPercentage((financials?.profitMargins || 0) * 100)}
					{#if (financials?.profitMargins || 0) > 0}
						<TrendingUp class="h-4 w-4 ml-1 text-green-600" />
					{:else}
						<TrendingDown class="h-4 w-4 ml-1 text-red-600" />
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Detailed Information Tabs -->
	<Tabs.Root value="overview" class="w-full">
		<Tabs.List class="grid w-full grid-cols-5">
			<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
			<Tabs.Trigger value="financials">Financials</Tabs.Trigger>
			<Tabs.Trigger value="valuation">Valuation</Tabs.Trigger>
			<Tabs.Trigger value="management">Management</Tabs.Trigger>
			<Tabs.Trigger value="risk">Risk Assessment</Tabs.Trigger>
		</Tabs.List>

		<!-- Overview Tab -->
		<Tabs.Content value="overview" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Business Summary</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-sm leading-relaxed">{profile?.longBusinessSummary || 'No business summary available'}</p>
				</Card.Content>
			</Card.Root>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Company Details</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Industry:</span>
							<span>{profile?.industryDisp || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Sector:</span>
							<span>{profile?.sectorDisp || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Country:</span>
							<span>{profile?.country || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Full Time Employees:</span>
							<span>{formatLargeNumber(profile?.fullTimeEmployees)}</span>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Trading Information</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Symbol:</span>
							<span class="font-medium">{company?.symbol || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Exchange:</span>
							<span>{company?.exchange || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Quote Type:</span>
							<span>{company?.quoteType || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Time Zone:</span>
							<span>{company?.timeZoneShortName || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">First Trade Date:</span>
							<span>{company?.firstTradeDateEpochUtc ? new Date(company.firstTradeDateEpochUtc).getFullYear() : 'N/A'}</span>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Analyst Recommendations</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Recommendation:</span>
							<Badge class={getRecommendationColor(financials?.recommendationKey || '')}>
								{financials?.recommendationKey?.toUpperCase() || 'N/A'}
							</Badge>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Target Mean Price:</span>
							<span>{formatCurrency(financials?.targetMeanPrice)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Target High:</span>
							<span>{formatCurrency(financials?.targetHighPrice)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Target Low:</span>
							<span>{formatCurrency(financials?.targetLowPrice)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Number of Analysts:</span>
							<span>{financials?.numberOfAnalystOpinions || 'N/A'}</span>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>

		<!-- Financials Tab -->
		<Tabs.Content value="financials" class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Revenue & Profitability</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Total Revenue</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(financials?.totalRevenue)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Gross Profit</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(financials?.grossProfits)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">EBITDA</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(financials?.ebitda)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Net Income</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(keyStats?.netIncomeToCommon)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Margins</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Gross Margin</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((financials?.grossMargins || 0) * 100)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Operating Margin</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((financials?.operatingMargins || 0) * 100)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">EBITDA Margin</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((financials?.ebitdaMargins || 0) * 100)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Profit Margin</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((financials?.profitMargins || 0) * 100)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Cash Flow</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Operating Cash Flow</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(financials?.operatingCashflow)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Free Cash Flow</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(financials?.freeCashflow)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Total Cash</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(financials?.totalCash)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Cash Per Share</Table.Cell>
									<Table.Cell class="text-right">{formatCurrency(financials?.totalCashPerShare)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Growth Metrics</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Revenue Growth</Table.Cell>
									<Table.Cell class="text-right flex items-center justify-end">
										{formatPercentage((financials?.revenueGrowth || 0) * 100)}
										{#if (financials?.revenueGrowth || 0) > 0}
											<TrendingUp class="h-4 w-4 ml-1 text-green-600" />
										{:else}
											<TrendingDown class="h-4 w-4 ml-1 text-red-600" />
										{/if}
									</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Earnings Growth</Table.Cell>
									<Table.Cell class="text-right flex items-center justify-end">
										{formatPercentage((financials?.earningsGrowth || 0) * 100)}
										{#if (financials?.earningsGrowth || 0) > 0}
											<TrendingUp class="h-4 w-4 ml-1 text-green-600" />
										{:else}
											<TrendingDown class="h-4 w-4 ml-1 text-red-600" />
										{/if}
									</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">EPS Growth (Quarterly)</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((keyStats?.earningsQuarterlyGrowth || 0) * 100)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>

		<!-- Valuation Tab -->
		<Tabs.Content value="valuation" class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Valuation Ratios</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Forward P/E</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(keyStats?.forwardPE)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Price to Book</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(keyStats?.priceToBook)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Enterprise Value</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(keyStats?.enterpriseValue)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">EV/Revenue</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(keyStats?.enterpriseToRevenue)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">EV/EBITDA</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(keyStats?.enterpriseToEbitda)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Share Information</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Shares Outstanding</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(keyStats?.sharesOutstanding)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Float</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(keyStats?.floatShares)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Shares Short</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(keyStats?.sharesShort)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Short Ratio</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(keyStats?.shortRatio)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Beta</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(keyStats?.beta)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Financial Health</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Current Ratio</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(financials?.currentRatio)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Quick Ratio</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(financials?.quickRatio)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Total Debt</Table.Cell>
									<Table.Cell class="text-right">{formatLargeNumber(financials?.totalDebt)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Debt to Equity</Table.Cell>
									<Table.Cell class="text-right">{formatNumber(financials?.debtToEquity)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Return on Assets</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((financials?.returnOnAssets || 0) * 100)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Return on Equity</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((financials?.returnOnEquity || 0) * 100)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>

		<!-- Management Tab -->
		<Tabs.Content value="management" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Executive Team</Card.Title>
					<Card.Description>Key executives and their compensation</Card.Description>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head>Title</Table.Head>
								<Table.Head>Age</Table.Head>
								<Table.Head class="text-right">Total Pay</Table.Head>
								<Table.Head class="text-right">Exercised Value</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each profile?.companyOfficers || [] as officer}
								<Table.Row>
									<Table.Cell class="font-medium">{officer.name}</Table.Cell>
									<Table.Cell>{officer.title}</Table.Cell>
									<Table.Cell>{officer.age || 'N/A'}</Table.Cell>
									<Table.Cell class="text-right">{formatCurrency(officer.totalPay)}</Table.Cell>
									<Table.Cell class="text-right">{formatCurrency(officer.exercisedValue)}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Risk Assessment Tab -->
		<Tabs.Content value="risk" class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Risk Metrics</Card.Title>
						<Card.Description>Lower scores indicate lower risk</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium">Overall Risk</span>
							<Badge class={getRiskColor(profile?.overallRisk || 0)}>
								{profile?.overallRisk || 'N/A'}/10
							</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium">Audit Risk</span>
							<Badge class={getRiskColor(profile?.auditRisk || 0)}>
								{profile?.auditRisk || 'N/A'}/10
							</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium">Board Risk</span>
							<Badge class={getRiskColor(profile?.boardRisk || 0)}>
								{profile?.boardRisk || 'N/A'}/10
							</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium">Compensation Risk</span>
							<Badge class={getRiskColor(profile?.compensationRisk || 0)}>
								{profile?.compensationRisk || 'N/A'}/10
							</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium">Shareholder Rights Risk</span>
							<Badge class={getRiskColor(profile?.shareHolderRightsRisk || 0)}>
								{profile?.shareHolderRightsRisk || 'N/A'}/10
							</Badge>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Ownership Structure</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Body>
								<Table.Row>
									<Table.Cell class="font-medium">Insider Holdings</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((keyStats?.heldPercentInsiders || 0) * 100)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Institutional Holdings</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((keyStats?.heldPercentInstitutions || 0) * 100)}</Table.Cell>
								</Table.Row>
								<Table.Row>
									<Table.Cell class="font-medium">Short Interest</Table.Cell>
									<Table.Cell class="text-right">{formatPercentage((keyStats?.shortPercentOfFloat || 0) * 100)}</Table.Cell>
								</Table.Row>
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>

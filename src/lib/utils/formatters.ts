export function formatCurrency(value: number | undefined, currency = 'USD'): string {
	if (value === undefined || value === null) return 'N/A';
	
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
}

export function formatNumber(value: number | undefined, decimals = 2): string {
	if (value === undefined || value === null) return 'N/A';
	
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format(value);
}

export function formatLargeNumber(value: number | undefined): string {
	if (value === undefined || value === null) return 'N/A';
	
	if (value >= 1e12) {
		return `${(value / 1e12).toFixed(2)}T`;
	} else if (value >= 1e9) {
		return `${(value / 1e9).toFixed(2)}B`;
	} else if (value >= 1e6) {
		return `${(value / 1e6).toFixed(2)}M`;
	} else if (value >= 1e3) {
		return `${(value / 1e3).toFixed(2)}K`;
	}
	
	return value.toLocaleString();
}

export function formatPercentage(value: number | undefined): string {
	if (value === undefined || value === null) return 'N/A';
	
	return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDate(timestamp: number | undefined): string {
	if (!timestamp) return 'N/A';
	
	return new Date(timestamp * 1000).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatDateTime(timestamp: number | undefined): string {
	if (!timestamp) return 'N/A';
	
	return new Date(timestamp * 1000).toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function getChangeColorClass(value: number | undefined): string {
	if (value === undefined || value === null) return '';
	return value >= 0 ? 'text-green-600' : 'text-red-600';
}

<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeToggle from './ThemeToggle.svelte';

	let { children } = $props();
</script>

<ModeWatcher />

<header class="flex items-center justify-between border-b p-4">
	<h1>Stock Analysis</h1>
	<nav class="flex items-center gap-4">
		<a href="/">Home</a>
		<a href="/search">Search</a>
		<a href="/api/quote">API Quote</a>
		<ThemeToggle />
	</nav>
</header>

<main class="w-full p-4">
	{@render children()}
</main>

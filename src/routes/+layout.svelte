<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeToggle from './ThemeToggle.svelte';

	let { children } = $props();
</script>

<ModeWatcher />

<header class="flex items-center justify-between border-b p-4">
	<a href="/"><h1 class="text-2xl font-bold">Stock Analysis</h1></a>
	<nav class="flex items-center gap-4">
		<a href="/search">Search</a>
		<a href="/compare">Compare</a>
		<a href="/projection">Projection</a>
		<ThemeToggle />
	</nav>
</header>

<main class="w-full p-4">
	{@render children()}
</main>

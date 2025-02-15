<script lang="ts">
	import { page } from '$app/state';
	import { decrypt_content } from '$lib/encryption';
	import Textarea from '$ui/textarea.svelte';
	import { onMount } from 'svelte';

	const content_id = page.params.id;

	let data = $state<string | null>(null);
	let error = $state<string | null>(null);
	let loading = $state<boolean>(true);

	onMount(async () => {
		try {
			const key = window.location.hash.slice(1);

			if (!key) {
				throw new Error('Invalid URL');
			}

			const res = await fetch(`/api/secrets/${content_id}`);

			if (!res.ok) {
				throw new Error(await res.text());
			}

			const { data: decrypted_data } = await res.json();
			data = await decrypt_content(decrypted_data, key);
		} catch (e) {
			if (e instanceof Error) {
				error = e.message;
			} else {
				error = String(e);
			}
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-medium">Someone shared a secret with you</h1>
		<p class="mt-2 text-gray-500">
			This secret will be permanently deleted after you close this page. Make sure to save any
			information you need before closing.
		</p>
	</div>

	{#if loading}
		<div>Decrypting...</div>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else}
		<Textarea readonly rows={6} value={data} />
	{/if}
</div>

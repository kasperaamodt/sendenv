<script lang="ts">
	import { page } from '$app/state';
	import { decrypt_content } from '$lib/encryption';
	import Button from '$ui/button.svelte';
	import Field from '$ui/field.svelte';
	import Label from '$ui/label.svelte';
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

	function handleCopy() {
		const selection = window.getSelection();
		const range = document.createRange();
		const textarea = document.getElementById('textarea-data');
		if (textarea) {
			range.selectNodeContents(textarea);
			selection?.removeAllRanges();
			selection?.addRange(range);
			setTimeout(() => {
				selection?.removeAllRanges();
			}, 100);
		}

		navigator.clipboard.writeText(data ?? '').catch((err) => {
			console.error('Failed to copy to clipboard', err);
		});
	}
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
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-4 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg
			>
			<span>Decrypting</span>
		</div>
	{:else if error}
		<span class="text-red-500">{error}</span>
	{:else}
		<Field>
			<Label>Shared secret</Label>
			<textarea
				id="textarea-data"
				rows={10}
				readonly
				class="w-full rounded-md border border-gray-200 p-2 text-base hover:cursor-copy"
				onclick={handleCopy}
				title="Click to copy"
				value={data}
			></textarea>
		</Field>

		<div class="flex justify-end">
			<Button type="button" onclick={handleCopy}>Copy secret</Button>
		</div>
	{/if}
</div>

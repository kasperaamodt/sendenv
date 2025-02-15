<script lang="ts">
	import { page } from '$app/state';
	import { decrypt_content } from '$lib/encryption';
	import { onMount } from 'svelte';

	const content_id = page.params.id;

	let data = $state<string | null>(null);
	let error = $state<string | null>(null);
	let loading = $state<boolean>(true);
	let is_copied = $state<boolean>(false);

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
		navigator.clipboard.writeText(data ?? '').catch((err) => {
			console.error('Failed to copy to clipboard', err);
		});
		is_copied = true;
		setTimeout(() => {
			is_copied = false;
		}, 2000);
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
		<div class="rounded-md bg-black">
			<div class="flex items-center justify-between p-2">
				<span class="text-xs text-gray-300"> Shared secret: </span>
				<button
					class="flex cursor-pointer items-center gap-1 text-gray-200"
					onclick={handleCopy}
					aria-label="Copy"
				>
					{#if is_copied}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-3"><path d="M20 6 9 17l-5-5" /></svg
						>
					{:else}
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
							class="size-3"
							><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path
								d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
							/></svg
						>
					{/if}
					<span class="text-xs">Copy</span>
				</button>
			</div>
			<textarea
				readonly
				rows={10}
				class="m-0 w-full rounded-md bg-[rgb(40,44,52)] p-4 text-base text-white">{data}</textarea
			>
		</div>
	{/if}
</div>

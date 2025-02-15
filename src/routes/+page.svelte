<script lang="ts">
	import { encrypt_content } from '$lib/encryption';
	import Button from '$ui/button.svelte';
	import Textarea from '$ui/textarea.svelte';

	let share_url = $state<string | null>(null);
	let loading = $state<boolean>(false);
	let is_copied = $state<boolean>(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		if (!(form instanceof HTMLFormElement)) return;

		loading = true;

		const fd = new FormData(form);

		const data = fd.get('data') as string | null;

		if (!data || !data?.trim()) {
			loading = false;
			alert('Please enter some text');
			return;
		}

		const { encrypted_data, key, id } = await encrypt_content(data);

		const response = await fetch('/api/secrets', {
			method: 'POST',
			body: JSON.stringify({ content_id: id, data: encrypted_data })
		});

		if (!response.ok) {
			loading = false;
			return;
		}

		const baseUrl = window.location.origin;
		share_url = `${baseUrl}/s/${id}#${key}`;
		loading = false;
	}

	function handleCopy() {
		navigator.clipboard.writeText(share_url ?? '').catch((err) => {
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
		<h1 class="text-2xl font-medium">Send secrets securely to anyone</h1>
		<p class="mt-2 text-gray-500">
			Your secrets are encrypted in your browser - only the recipient with the correct link can read
			them. Even we can't read your secrets. Links expire after 1 hour and can only be used once.
		</p>
	</div>

	{#if !share_url}
		<form onsubmit={handleSubmit}>
			<Textarea name="data" placeholder="Enter your secret content here..." rows={6}></Textarea>

			<div class="mt-2 flex justify-end">
				<Button type="submit" disabled={loading}>
					{loading ? 'Encrypting...' : 'Generate link'}
				</Button>
			</div>
		</form>
	{/if}

	{#if share_url && !loading}
		<div class="rounded-md bg-black">
			<div class="flex items-center justify-between p-2">
				<span class="text-xs text-gray-300">Your share link (expires in 1 hour):</span>
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
			<pre
				class="overflow-y-scroll rounded-md bg-[rgb(40,44,52)] p-4 text-sm text-white [&::-webkit-scrollbar]:h-1.5
                [&::-webkit-scrollbar]:w-1">{share_url}</pre>
		</div>
	{/if}
</div>

<script lang="ts">
	import { encrypt_content } from '$lib/encryption';
	import Button from '$ui/button.svelte';
	import Field from '$ui/field.svelte';
	import Label from '$ui/label.svelte';
	import Select from '$ui/select.svelte';
	import Textarea from '$ui/textarea.svelte';

	let share_url = $state<string | null>(null);
	let loading = $state<boolean>(false);
	let expiration = $state<number>(1);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const form = e.currentTarget;
		if (!(form instanceof HTMLFormElement)) return;

		loading = true;

		const fd = new FormData(form);

		const data = fd.get('data') as string | null;
		const exp = fd.get('expiration') ? Number(fd.get('expiration')) : 1;
		expiration = exp;

		if (!data || !data.trim()) {
			loading = false;
			alert('Please enter some text');
			return;
		}

		const { encrypted_data, key, id } = await encrypt_content(data);

		const response = await fetch('/api/secrets', {
			method: 'POST',
			body: JSON.stringify({ content_id: id, data: encrypted_data, expiration: exp })
		});

		if (!response.ok) {
			loading = false;
			return;
		}

		const baseUrl = window.location.origin;
		share_url = `${baseUrl}/s/${id}#${key}`;
		loading = false;
	}

	function handleReset() {
		expiration = 1;
		share_url = null;
	}

	function handleCopy() {
		navigator.clipboard.writeText(share_url ?? '').catch((err) => {
			console.error('Failed to copy to clipboard', err);
		});

		const selection = window.getSelection();
		const range = document.createRange();
		const button = document.getElementById('share-url');
		if (button) {
			range.selectNodeContents(button);
			selection?.removeAllRanges();
			selection?.addRange(range);
			setTimeout(() => {
				selection?.removeAllRanges();
			}, 100);
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-medium">Send secrets securely to anyone</h1>
		<p class="mt-2 text-gray-500">
			Your secrets are encrypted in your browser - only the recipient with the correct link can read
			them. Even we can't read your secrets. Links expire after 1 hour by default and can only be
			used once.
		</p>
	</div>

	{#if !share_url}
		<form onsubmit={handleSubmit}>
			<Textarea name="data" placeholder="Enter your secret content here..." rows={6}></Textarea>

			<div class="mt-2 flex justify-end gap-2">
				<Select name="expiration">
					<option value="1" selected>1 hour</option>
					<option value="3">3 hours</option>
					<option value="6">6 hours</option>
					<option value="12">12 hours</option>
					<option value="24">24 hours</option>
				</Select>
				<Button type="submit" disabled={loading}>
					{loading ? 'Encrypting...' : 'Generate link'}
				</Button>
			</div>
		</form>
	{/if}

	{#if share_url && !loading}
		<Field>
			<Label>
				Your share link (expires in {expiration} hour{expiration > 1 ? 's' : ''})
			</Label>
			<button
				id="share-url"
				class="w-full rounded-md border border-gray-200 p-2 text-left hover:cursor-copy"
				onclick={handleCopy}
				title="Click to copy"
			>
				{share_url}
			</button>
		</Field>

		<div class="flex justify-end gap-2">
			<Button type="button" variant="secondary" onclick={handleReset}>Start over</Button>
			<Button type="button" onclick={handleCopy}>Copy link</Button>
		</div>
	{/if}
</div>

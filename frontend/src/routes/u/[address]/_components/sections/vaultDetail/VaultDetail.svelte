<script lang="ts">
	import type { UserData } from '../../../_types/user-data.interface';
	import { fly, fade } from 'svelte/transition';
	import { Currency } from '@emerald-dao/component-library';
	import Icon from '@iconify/svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import TransactionsList from '../../atoms/TransactionsList.svelte';
	import { getLockedTokens } from '../../../actions/getLockedTokens';
	import type { LockedVaultDetails } from '$lib/types/dao-project/lock-tokens/locked-vault-details.interface';
	import { onMount } from 'svelte';
	import ProjectLockTokens from '../../atoms/ProjectLockTokens.svelte';
	import { page } from '$app/stores';
	import { handleLogoImgError } from '$lib/utilities/handleLogoImgError';

	const userData: UserData = getContext('userData');
	const selectedVaultStore: Writable<number | null> = getContext('selectedVault');

	let projectLockTokens: LockedVaultDetails[] = [];

	$: vault = $selectedVaultStore !== null ? userData.vaults[$selectedVaultStore] : null;

	$: transactions =
		$selectedVaultStore !== null
			? userData.transactions.filter(
					(transaction) => transaction.project_id === vault?.daoData.projectId
			  )
			: null;

	onMount(async () => {
		if (vault) {
			projectLockTokens = await getLockedTokens(vault, $page.params.address);
		}
	});

	const handleCloseVault = () => {
		selectedVaultStore.set(null);
	};

	const handleNextVault = () => {
		selectedVaultStore.update((value) => {
			if (value === null) return 0;
			else return value + 1;
		});
	};

	const handlePrevVault = () => {
		selectedVaultStore.update((value) => {
			if (value === null) return 0;
			else return value - 1;
		});
	};
</script>

{#if vault}
	<div class="main-wrapper column-10" transition:fly={{ x: 400, duration: 800 }}>
		<div class="close-button header-link" on:click={handleCloseVault}>
			<Icon icon="tabler:x" />
		</div>
		<div class="content-wrapper">
			<div class="card-primary">
				<div class="column-6">
					<div class="row-2 align-center">
						<img
							src={vault.daoData.logoUrl}
							on:error={(e) => handleLogoImgError(e)}
							alt="Emerald City Logo"
							class="logo"
						/>
						<h4 class="w-medium">{vault.daoData.name}</h4>
					</div>
					<div class="row-5 align-end">
						<Currency
							amount={vault.balance}
							currency={vault.daoData.tokenSymbol}
							fontSize="var(--font-size-6)"
							decimalNumbers={2}
							color="heading"
						/>
						<Currency
							amount={vault.balance * vault.tokenValue}
							moneyPrefix={true}
							fontSize="var(--font-size-3)"
							decimalNumbers={2}
						/>
					</div>
				</div>
				<div class="column-space-between">
					<div>
						{#if $selectedVaultStore !== null && $selectedVaultStore > 0}
							<div
								class="header-link"
								on:click={handlePrevVault}
								transition:fade={{ duration: 100 }}
							>
								<Icon icon="tabler:arrow-up" />
							</div>
						{/if}
					</div>
					<div>
						{#if $selectedVaultStore !== null && userData.vaults.length - 1 > $selectedVaultStore}
							<div
								class="header-link"
								on:click={handleNextVault}
								transition:fade={{ duration: 100 }}
							>
								<Icon icon="tabler:arrow-down" />
							</div>
						{/if}
					</div>
				</div>
			</div>
			<div class="events-wrapper">
				{#if transactions}
					<TransactionsList events={transactions} />
				{/if}
				{#if projectLockTokens}
					<div style="padding-top:20px;">
						<ProjectLockTokens
							lockedVaults={projectLockTokens}
							projectOwner={vault?.daoData.owner}
							projectId={vault?.daoData.projectId}
						/>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.main-wrapper {
		display: none;

		@include mq('medium') {
			display: block;
		}

		position: fixed;
		right: 0;
		background-color: var(--clr-background-secondary);
		height: 100%;
		min-width: 50vw;

		.content-wrapper {
			padding: var(--space-14);
			display: flex;
			flex-direction: column;
			gap: var(--space-6);
			flex: 1;

			.card-primary {
				border-color: var(--clr-neutral-badge);
				background: linear-gradient(
						to right,
						rgba(18, 18, 18, 0.97),
						rgba(18, 18, 18, 1),
						rgba(18, 18, 18, 0.98),
						rgba(18, 18, 18, 0.9)
					),
					url(/toucans-illustration.png);
				background-size: cover;
				display: flex;
				flex-direction: row;
				justify-content: space-between;

				.logo {
					width: 50px;
					height: 50px;
					border-radius: 50%;
				}

				h4 {
					font-size: var(--font-size-5);
				}
			}

			.events-wrapper {
				padding-inline: var(--space-7);
				overflow: hidden;
				max-height: 300px;
				overflow-y: auto;
			}
		}

		.close-button {
			position: absolute;
			left: 20px;
			top: 20px;
		}
	}
</style>

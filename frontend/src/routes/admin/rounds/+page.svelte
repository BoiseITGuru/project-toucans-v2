<script type="ts">
	import RoundsList from '$lib/components/dao-data-blocks/funding-rounds/list/RoundsList.svelte';
	import { fly } from 'svelte/transition';
	import type { DAOProject } from '$lib/types/dao-project/dao-project.interface';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import RoundGeneratorModal from '$lib/features/round-generator/components/RoundGeneratorModal.svelte';

	const adminData: {
		activeDao: Writable<number>;
		userDaos: Writable<DAOProject[]>;
	} = getContext('admin-data');

	const activeDaoStore = adminData.activeDao;
	const userDaosStore = adminData.userDaos;

	$: activeDaoData = $userDaosStore[$activeDaoStore];
</script>

<div in:fly={{ x: 10, duration: 400 }} class="main-wrapper">
	<h5>Funding Rounds</h5>
	<div class="rounds-wrapper">
		{#if activeDaoData.onChainData.fundingCycles.length < 1}
			<span><em>This project has no funding rounds yet</em></span>
		{:else}
			<RoundsList daoData={activeDaoData} />
		{/if}
	</div>
	<div class="create-round-wrapper">
		<RoundGeneratorModal daoData={activeDaoData} />
	</div>
</div>

<style type="scss">
	.main-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: var(--space-10);

		h5 {
			margin-bottom: var(--space-2);
			margin-top: 0;
		}

		em {
			color: var(--clr-text-off);
		}
	}
</style>

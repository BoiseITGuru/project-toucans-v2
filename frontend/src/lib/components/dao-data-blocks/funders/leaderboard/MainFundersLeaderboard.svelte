<script lang="ts">
	import { Currency } from '@emerald-dao/component-library';
	import LeaderboardListElement from '../../../leaderboards/atoms/LeaderboardListElement.svelte';
	import type { DAOProject } from '$lib/types/dao-project/dao-project.interface';
	import ListWrapper from '$components/atoms/lists/ListWrapper.svelte';

	export let daoData: DAOProject;

	let paginationMax: number;
	let paginationMin: number;

	let pageMove: 'next' | 'previous' = 'next';

	const mainFundersEntries = Object.entries(daoData.funding.funders).sort(
		(a, b) => Number(b[1]) - Number(a[1])
	);
</script>

<div>
	<ListWrapper
		itemsPerPage={6}
		totalItems={mainFundersEntries.length}
		noItemsMessage="This DAO has no funders yet"
		bind:paginationMax
		bind:paginationMin
		on:nextPage={() => (pageMove = 'next')}
		on:previousPage={() => (pageMove = 'previous')}
	>
		{#each mainFundersEntries as [address, funding], i}
			{#if i < paginationMax && i >= paginationMin}
				<LeaderboardListElement
					rank={i + 1}
					{address}
					bind:pageMove
					pagePosition={i - paginationMin}
				>
					<Currency amount={funding} moneyPrefix={true} decimalNumbers={2} color="heading" />
				</LeaderboardListElement>
			{/if}
		{/each}
	</ListWrapper>
</div>

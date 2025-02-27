<script type="ts">
	import { DiscoverProjectSidebar, DiscoverProjectMain, SeeMoreSidebar } from './_components';
	import { setContext } from 'svelte';
	import type { DAOProject } from '$lib/types/dao-project/dao-project.interface';
	import { writable, type Writable } from 'svelte/store';
	import type { DaoEvent } from '$lib/types/dao-project/dao-event/dao-event.type';
	import { supabase } from '$lib/supabaseClient';
	import { getProjectInfo, getTokenBalance, hasProjectVaultSetup } from '$flow/actions';
	import { user } from '$stores/flow/FlowStore';
	import Icon from '@iconify/svelte';
	import { Seo } from '@emerald-dao/component-library';

	export let data: DAOProject;

	let seeMore = false;

	let daoDataStore: Writable<DAOProject> = writable(data, (set) => {
		const subscription = supabase
			.channel('events')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'events',
					filter: `project_id=eq.${data.generalInfo.project_id}`
				},
				(payload) => {
					const newEvent = payload.new as DaoEvent;

					reloadBlockchainData();

					if (newEvent.type === 'Purchase' && newEvent.data.by === $user.addr) {
						reloadUserBalance();
					}

					$daoDataStore.events?.push(newEvent);

					return set($daoDataStore);
				}
			)
			.subscribe();

		return () => supabase.removeChannel(subscription);
	});

	setContext('daoData', $daoDataStore);

	const reloadBlockchainData = async () => {
		$daoDataStore.onChainData = await getProjectInfo(
			data.generalInfo.contract_address,
			data.generalInfo.owner,
			data.generalInfo.project_id
		);
	};

	const reloadUserBalance = async () => {
		if (!data.generalInfo.contract_address) return;
		$daoDataStore.vaultSetup = true;

		if ($user.addr) {
			$daoDataStore.userBalance = await getTokenBalance(
				data.generalInfo.project_id,
				data.generalInfo.contract_address,
				$user.addr
			);
			$daoDataStore.vaultSetup = await hasProjectVaultSetup(
				data.generalInfo.contract_address,
				data.generalInfo.project_id,
				$user.addr
			);
		}
	};

	$: $user.addr && reloadUserBalance();
</script>

<section class="container">
	<div class="main-wrapper">
		<div class="project-sidebar-wrapper">
			<DiscoverProjectSidebar daoData={$daoDataStore} />
		</div>
		<div class="secondary-wrapper">
			<DiscoverProjectMain daoData={$daoDataStore} />
		</div>
	</div>
	{#if data.generalInfo.long_description}
		<div class="hide-on-mobile">
			<div class="button" on:click={() => (seeMore = !seeMore)} on:keydown>
				<Icon icon="tabler:arrow-left" />
				<p class="xsmall w-medium">About us</p>
			</div>
			{#if seeMore}
				<SeeMoreSidebar
					longDescription={data.generalInfo.long_description}
					on:closeModal={() => (seeMore = !seeMore)}
				/>
			{/if}
		</div>
	{/if}
</section>

<Seo
	title={`${$daoDataStore.generalInfo.name} | Toucans`}
	description={`${$daoDataStore.generalInfo.name} DAO project`}
	type="WebPage"
	image="https://toucans.ecdao.org/favicon.png"
/>

<style type="scss">
	.main-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;

		@include mq(medium) {
			display: grid;
			grid-template-columns: 1.3fr 2fr;
			gap: 4rem;
		}

		.project-sidebar-wrapper {
			position: relative;
			top: 0;

			@include mq(medium) {
				position: sticky;
				top: var(--space-12);
				height: fit-content;
			}
		}

		.secondary-wrapper {
			margin-top: var(--space-10);

			@include mq(medium) {
				margin-top: 0;
			}
		}
	}

	.button {
		position: fixed;
		right: 0;
		top: 20vh;
		display: flex;
		align-items: center;
		padding: var(--space-2) var(--space-4);
		border-right-width: 0px;
		border-radius: var(--radius-1) 0px 0px var(--radius-1);
		cursor: pointer;
		background-color: var(--clr-surface-secondary);
		gap: var(--space-1);
	}
</style>

<script type="ts">
	import type { FundingCycle } from '$lib/types/dao-project/funding-rounds/funding-cycle.interface';
	import FundingNumbers from '../atoms/FundingNumbers.svelte';
	import IconCircle from '$components/atoms/IconCircle.svelte';
	import SeeRoundDetailsModal from '../atoms/SeeRoundDetailsModal.svelte';
	import GoalReached from '$components/atoms/GoalReached.svelte';
	import type { ECurrencies } from '$lib/types/common/enums';
	import RoundStatusLabel from '../atoms/RoundStatusLabel.svelte';
	import { Button } from '@emerald-dao/component-library';
	import Icon from '@iconify/svelte';
	import { getRoundTiming } from '../helpers/getRoundTiming';
	import { getRoundStatus } from '../helpers/getRoundStatus';
	import { togglePurchasingExecution } from '$flow/actions';
	import EditRoundModal from '$lib/features/edit-round/components/EditRoundModal.svelte';

	export let round: FundingCycle;
	export let roundNumber: number;
	export let projectToken: string;
	export let paymentToken: ECurrencies;
	export let projectId: string;
	export let activeRound: number | null;
	export let admin: boolean = false;
	export let paused: boolean = true;

	$: goal = round.details.fundingTarget ? Number(round.details.fundingTarget) : 'infinite';
	$: funding = round.raisedTowardsGoal ? Number(round.raisedTowardsGoal) : 0;

	$: goalReached = goal != 'infinite' ? (goal as number) <= funding : false;

	$: startDate = new Date(Number(round.details.timeframe.startTime) * 1000);
	$: endDate = round.details.timeframe.endTime
		? new Date(Number(round.details.timeframe.endTime) * 1000)
		: null;

	$: roundStatus = getRoundStatus(roundNumber, activeRound, startDate);
</script>

<div class="main-wrapper row-space-between align-center">
	<div class="row-4 align-center">
		<IconCircle
			icon={`${roundNumber + 1}`}
			color={roundStatus === 'active'
				? 'primary'
				: roundStatus === 'upcoming'
				? 'tertiary'
				: 'alert'}
		/>
		<FundingNumbers {goal} {funding} {paymentToken} />
		{#if endDate == null && roundStatus === 'active' && admin}
			{#if paused}
				<Button
					color="neutral"
					type="ghost"
					size="x-small"
					on:click={() => togglePurchasingExecution(projectId)}
				>
					<Icon icon="tabler:player-play-filled" />
					Start
				</Button>
			{:else}
				<Button
					color="neutral"
					type="ghost"
					size="x-small"
					on:click={() => togglePurchasingExecution(projectId)}
				>
					<Icon icon="tabler:player-pause-filled" />
					Pause
				</Button>
			{/if}
		{/if}
		{#if goalReached}
			<GoalReached />
		{/if}
	</div>
	<div class="row-5 align-center">
		<span class="xsmall date">
			{getRoundTiming(startDate, endDate, roundStatus === 'active')}
		</span>
		<RoundStatusLabel status={roundStatus} />
		<div class="row-2">
			{#if roundStatus !== 'finished' && admin}
				<EditRoundModal {round} cycleIndex={roundNumber} />
			{/if}
			<SeeRoundDetailsModal
				{round}
				{roundNumber}
				{projectToken}
				{paymentToken}
				{projectId}
				{activeRound}
			/>
		</div>
	</div>
</div>

<style type="scss">
	.main-wrapper {
		padding: var(--space-3) 0;
		border-bottom: 1px var(--clr-neutral-badge) solid;
		width: 100%;

		.date {
			color: var(--clr-text-off);
		}
	}
</style>

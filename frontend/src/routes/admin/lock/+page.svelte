<script type="ts">
	import { fly } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import { getContext } from 'svelte';
	import type { DAOProject } from '$lib/types/dao-project/dao-project.interface';
	import DistributeTokens from '$lib/features/distribute-tokens/components/DistributeTokens.svelte';

	const adminData: {
		activeDao: Writable<number>;
		userDaos: Writable<DAOProject[]>;
	} = getContext('admin-data');

	const activeDaoStore = adminData.activeDao;
	const userDaosStore = adminData.userDaos;

	$: activeDaoData = $userDaosStore[$activeDaoStore];
</script>

<div in:fly={{ x: 10, duration: 400 }}>
	<DistributeTokens daoData={activeDaoData} distributionType="lock" />
</div>

<script type="ts">
	import { theme } from '$stores/ThemeStore';
	import { Button, Currency, Seo } from '@emerald-dao/component-library';
	import Icon from '@iconify/svelte';

	const DAO_TYPES = [
		{
			title: 'DAO',
			description:
				'This option will launch a DAO. It will set up a multi-sig treasury, the ability to donate, vote, and more. It will not create a token upon deployment.',
			icon: 'tabler:users',
			slug: 'dao',
			estimatedTime: '3 minutes'
		},
		{
			title: 'DAO + Token',
			description:
				'This option will do everything the DAO option does as well as deploy a new fungible token on the Flow blockchain for you to fundraise with, mint, trade, and more.',
			icon: 'tabler:coin',
			slug: 'dao-token',
			estimatedTime: '5 minutes'
		}
	];

	let selectedDaoType = DAO_TYPES[0].slug;
</script>

<section
	style={`background: 
    linear-gradient(
			${
				$theme === 'dark'
					? `rgba(18, 18, 18, 0.97), 
      rgba(18, 18, 18, 1)`
					: `rgba(250, 250, 250, 0.97), 
      rgba(250, 250, 250, 1)`
			}
    ),
    url(/toucans-illustration.png);`}
>
	<div class="container-small center column-12">
		<div class="column-3 center">
			<h2 class="h4 w-medium">Create a DAO in Minutes!</h2>
			<p>Choose an option below before getting started.</p>
		</div>

		<div class="row-6">
			{#each DAO_TYPES as daoType}
				<div
					class="card column-3"
					on:click={() => (selectedDaoType = daoType.slug)}
					class:active={selectedDaoType === daoType.slug}
				>
					<div class="row-3 align-center">
						<div class="icon-wrapper">
							<Icon icon={daoType.icon} width="1.2rem" />
						</div>
						<h4>
							{daoType.title}
						</h4>
					</div>
					<p>{daoType.description}</p>
					<div class="column-1">
						<div class="row-2 align-center off">
							<Icon icon="tabler:clock" />
							<span class="small off">
								{`Takes only ${daoType.estimatedTime} to create`}
							</span>
						</div>
						<div class="row-2 align-center off">
							<Icon icon="tabler:cash" />
							<span class="small off"> Cost: Free! </span>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<Button href={`/dao-generator/${selectedDaoType}`} width="extended" size="large"
			>Configure your DAO</Button
		>
	</div>
</section>

<Seo
	title={`Generato DAO | Toucans`}
	description={`Generate your own DAO in Toucans`}
	type="WebPage"
	image="https://toucans.ecdao.org/favicon.png"
/>

<style type="scss">
	section {
		flex: 1;
		display: grid;
		place-content: center;

		.card {
			cursor: pointer;
			background-color: var(--clr-background-primary);

			.icon-wrapper {
				background-color: var(--clr-neutral-badge);
				color: var(--clr-font-main);
				border-radius: 50%;
				width: 3rem;
				height: 3rem;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.off {
				color: var(--clr-text-off);
			}

			&.active {
				border-color: var(--clr-primary-main);

				.icon-wrapper {
					background-color: var(--clr-primary-badge);
					color: var(--clr-primary-main);
				}
			}
		}
	}
</style>

import type { Badge } from './badges.interfaces';

const USER_BADGES: Badge[] = [
	{
		name: 'Generous Toucan',
		levels: [
			{
				name: '❤️ Tenderhearted Toucan',
				image: 'tenderhearted-toucan.png',
				description: "You've dipped your beak into the world of giving. Keep spreading kindness!",
				goal: 'Donate 1 time'
			},
			{
				name: '💖 Kindhearted Toucan',
				image: 'kindhearted-toucan.png',
				description: "Your generosity is taking flight! You're making a positive impact.",
				goal: 'Donate 5 times'
			},
			{
				name: '🌟 Philanthropic Toucan',
				image: 'philanthropic-toucan.png',
				description: 'Your giving spirit soars high! Your contributions are making a difference.',
				goal: 'Donate 10 times'
			},
			{
				name: '🙌 Benevolent Toucan',
				image: 'benevolent-toucan.png',
				description: "Your benevolence knows no bounds! You're an inspiration to others.",
				goal: 'Donate 20 times'
			},
			{
				name: '🔥 Magnanimous Toucan',
				image: 'magnanimous-toucan.png',
				description: "You're the epitome of generosity! Your support has a tremendous impact.",
				goal: 'Donate 50 times'
			}
		],
		rule: (user) => {
			const donationCount = user.transactions.filter(
				(transaction) => transaction.type === 'Donate'
			).length;
			if (donationCount >= 50) return 5;
			if (donationCount >= 20) return 4;
			if (donationCount >= 10) return 3;
			if (donationCount >= 5) return 2;
			if (donationCount >= 1) return 1;
			return 0;
		}
	},
	{
		name: 'Capitalized Toucan',
		levels: [
			{
				name: '💰 Feather Investor',
				image: 'feather-investor.png',
				description:
					"You've taken the first step towards financial success! Your feathers hold potential.",
				goal: 'Invest in 1 project'
			},
			{
				name: '🚀 Winged Backer',
				image: 'winged-backer.png',
				description:
					'Your support takes flight! Your investments contribute to exciting opportunities.',
				goal: 'Invest in 5 projects'
			},
			{
				name: '🤝 Beak Benefactor',
				image: 'beak-benefactor.png',
				description:
					"Your funding makes a significant impact! You're shaping the future of projects.",
				goal: 'Invest in 10 projects'
			},
			{
				name: '💼 Plumage Sponsor',
				image: 'plumage-sponsor.png',
				description:
					"You're a prominent sponsor! Your contributions propel projects towards success.",
				goal: 'Invest in 20 projects'
			},
			{
				name: '🌟 Flight Patron',
				image: 'flight-patron.png',
				description:
					"You're a revered patron! Your substantial funding elevates projects to new heights.",
				goal: 'Invest in 50 projects'
			}
		],
		rule: (user) => {
			const investmentCount = user.transactions.filter(
				(transaction) => transaction.type === 'Purchase'
			).length;
			if (investmentCount >= 50) return 5;
			if (investmentCount >= 20) return 4;
			if (investmentCount >= 10) return 3;
			if (investmentCount >= 5) return 2;
			if (investmentCount >= 1) return 1;
			return 0;
		}
	},
	{
		name: 'Pioneering Plumage',
		levels: [
			{
				name: '🏗️ Feathered Founder',
				image: 'feathered-founder.png',
				description:
					"You're a trailblazer in the world of DAOs! Your founding contribution is invaluable.",
				goal: 'Create 1 DAO'
			},
			{
				name: '🌠 Trailblazing Toucan',
				image: 'trailblazing-toucan.png',
				description: "Your vision leads the way! You're paving new paths for DAO creation.",
				goal: 'Create 2 DAOs'
			},
			{
				name: '🔮 Visionary Avian',
				image: 'visionary-avian.png',
				description: "Your foresight is extraordinary! You're shaping the future with your DAOs.",
				goal: 'Create 3 DAOs'
			},
			{
				name: '💡 Innovating Beak',
				image: 'innovating-beak.png',
				description:
					"You're an innovator among toucans! Your DAOs inspire others with their uniqueness.",
				goal: 'Create 4 DAOs'
			},
			{
				name: '🚩 Revolutionary Plumage',
				image: 'revolutionary-plumage.png',
				description:
					"You're a revolutionary force! Your DAOs challenge the status quo and bring change.",
				goal: 'Create 5 DAOs'
			}
		],
		rule: (user) => {
			const daoCount = user.signerOf.length;
			if (daoCount >= 5) return 5;
			if (daoCount >= 4) return 4;
			if (daoCount >= 3) return 3;
			if (daoCount >= 2) return 2;
			if (daoCount >= 1) return 1;
			return 0;
		}
	},
	{
		name: 'Efficient Plumage',
		levels: [
			{
				name: '⏩ Expedient Toucan',
				image: 'expedient-toucan.png',
				description:
					"You're swift and efficient! Your transactions are executed with speed and precision.",
				goal: 'Perform 10 transactions'
			},
			{
				name: '🔄 Streamlined Avian',
				image: 'streamlined-avian.png',
				description: "You've mastered the art of efficiency! Your transactions flow seamlessly.",
				goal: 'Perform 50 transactions'
			},
			{
				name: '🛠️ Resourceful Beak',
				image: 'resourceful-beak.png',
				description: "You're a resourceful toucan! Your transactions are optimized and effective.",
				goal: 'Perform 100 transactions'
			},
			{
				name: '📈 Productive Plumage',
				image: 'productive-plumage.png',
				description:
					'Your productivity knows no bounds! Your transactions yield impressive results.',
				goal: 'Perform 500 transactions'
			},
			{
				name: '✨ Optimal Feather',
				image: 'optimal-feather.png',
				description:
					"You're a model of optimal efficiency! Your transactions set the gold standard.",
				goal: 'Perform 1000 transactions'
			}
		],
		rule: (user) => {
			const transactionCount = user.transactions.length;
			if (transactionCount >= 100) return 5;
			if (transactionCount >= 50) return 4;
			if (transactionCount >= 25) return 3;
			if (transactionCount >= 10) return 2;
			if (transactionCount >= 1) return 1;
			return 0;
		}
	}
];

export default USER_BADGES;

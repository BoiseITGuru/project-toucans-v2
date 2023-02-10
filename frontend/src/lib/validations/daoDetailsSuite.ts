import { create, enforce, test, skipWhen, only, include, optional } from 'vest';

const daoDetailsSuite = create((data = {}, currentField, daoProjects) => {
	only(currentField);
	include('contractName').when(() => currentField === 'name');

	optional(['website', 'discord', 'twitter']);

	test('name', 'Your DAO needs a name!', () => {
		enforce(data.name).isNotBlank();
	});

	test('name', 'Name must be at least 4 chars', () => {
		enforce(data.name).longerThan(4);
	});

	skipWhen(daoDetailsSuite.get().hasErrors('name'), () => {
		test.memo(
			'name',
			'Name already taken',
			async () => {
				await checkDaoName(data.name, daoProjects);
			},
			[data.name]
		);
	});

	skipWhen(daoDetailsSuite.get().hasErrors('name'), () => {
		test.memo(
			'contractName',
			'Contract name already taken',
			async () => {
				await checkDaoContract(data.contractName, daoProjects);
			},
			[data.contractName]
		);
	});

	test('tokenName', 'We need a name for your token', () => {
		enforce(data.tokenName).isNotBlank();
	});

	test('tokenName', 'Token name should be shorter than 5 chars', () => {
		enforce(data.tokenName).shorterThan(5);
	});

	skipWhen(daoDetailsSuite.get().hasErrors('tokenName'), () => {
		test.memo(
			'tokenName',
			'Token name already taken',
			async () => {
				await checkDaoToken(data.tokenName, daoProjects);
			},
			[data.tokenName]
		);
	});

	test('description', 'Description is needed', () => {
		enforce(data.description).isNotBlank();
	});

	test('description', 'Description should be longer than 20 chars', () => {
		enforce(data.description).longerThan(20);
	});

	test('website', 'Must be a valid URL', () => {
		enforce(data.website).matches(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/);
	});

	test('twitter', 'Must start with @', () => {
		enforce(data.twitter).matches(/^@/);
	});

	test('twitter', 'Must be longer than 3 chars', () => {
		enforce(data.twitter).longerThan(3);
	});

	test('discord', 'Must be a valid discord link', () => {
		enforce(data.discord).matches(/^https:\/\/(discord\.(gg|com)\/)/i);
	});

	test('discord', 'Must be longer than 22 chars', () => {
		enforce(data.discord).longerThan(22);
	});
});

const checkDaoName = async (value: string, daoProjects: DaoProject[]): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		if (daoProjects.some((obj) => obj.name === value)) {
			reject();
		} else {
			resolve(true);
		}
	});
};

const checkDaoContract = async (value: string, daoProjects: DaoProject[]): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		if (daoProjects.some((obj) => obj.contract_name === value)) {
			reject();
		} else {
			resolve(true);
		}
	});
};

const checkDaoToken = async (value: string, daoProjects: DaoProject[]): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		if (daoProjects.some((obj) => obj.token_symbol === value)) {
			reject();
		} else {
			resolve(true);
		}
	});
};

interface DaoProject {
	name: string;
	token_symbol: string;
	contract_name: string;
}

export default daoDetailsSuite;

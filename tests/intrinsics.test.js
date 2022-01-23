const {
	Interpreter,
	Debugger
} = require('greybel-interpreter');
const defaultInit = require('greybel-intrinsics').init;
const { init } = require('../dist');
const fs = require('fs');
const path = require('path');
const testFolder = path.resolve(__dirname, 'scripts');

let printMock;
const pseudoAPI = new Map();

const testDate = new Date(1642924301240);

Date.now = () => testDate.getTime();

pseudoAPI.set('print', (customValue) => {
	printMock(customValue);
});

class TestDebugger extends Debugger {
	debug() {}
}

describe('interpreter', function() {
	beforeEach(function() {
		printMock = jest.fn();
	});

	describe('default scripts', function() {
		fs
			.readdirSync(testFolder)
			.forEach(file => {
				const filepath = path.resolve(testFolder, file);

				test(path.basename(filepath), async () => {
					const interpreter = new Interpreter({
						target: filepath,
						api: defaultInit(init(pseudoAPI)),
						debugger: new TestDebugger()
					});
					let success = false;

					try {
						await interpreter.digest();
						success = true;
					} catch (e) {
						console.log(`${filepath} failed with: `, e);
					}

					expect(success).toEqual(true);
					for (const call of printMock.mock.calls) {
						expect(call[0]).toMatchSnapshot();
					}
				});
			});
	});
});
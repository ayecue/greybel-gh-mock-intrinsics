const {
  Debugger,
  OutputHandler,
  HandlerContainer,
  ObjectValue
} = require('greybel-interpreter');
const {
  Interpreter
} = require('greyscript-interpreter');
const defaultInit = require('greybel-intrinsics').init;
const { init, createGHMockEnv } = require('../dist');
const fs = require('fs');
const path = require('path');
const testFolder = path.resolve(__dirname, 'scripts');

let printMock;

const testDate = new Date(1642924301240);

Date.now = () => testDate.getTime();

class TestOutputHandler extends OutputHandler {
  print(vm, value) {
    printMock(value);
  }

  update(vm, value) {
    printMock(value);
  }

  progress(vm, time) {
    return Promise.resolve();
  }

  waitForInput(vm, isPassword, value) {
    printMock(value);
    return Promise.resolve('test');
  }

  waitForKeyPress(vms, value) {
    printMock(value);
    return Promise.resolve({
      keyCode: 13,
      code: 'Enter'
    });
  }

  clear() {
    printMock('clearing screen');
  }
}

class TestDebugger extends Debugger {
  debug() {
    printMock("debug");
  }

  interact(vm, item) {
    printMock("interact at " + item.start.line);
  }

  resume() {
    printMock("resume");
  }
}

describe('interpreter', function () {
  beforeEach(function () {
    printMock = jest.fn();
  });

  describe('default scripts', function () {
    fs.readdirSync(testFolder).forEach((file) => {
      const filepath = path.resolve(testFolder, file);

      test(path.basename(filepath), async () => {
        const interpreter = new Interpreter({
          target: filepath,
          handler: new HandlerContainer({
            outputHandler: new TestOutputHandler()
          }),
          debugger: new TestDebugger()
        });
        let success = false;

        interpreter.setApi(defaultInit(init(new ObjectValue(), createGHMockEnv(interpreter, {
          myProgramContent: fs.readFileSync(filepath, {
            encoding: 'utf-8'
          })
        }))));

        try {
          await interpreter.run();
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

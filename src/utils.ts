import { KeyEvent } from 'greybel-interpreter';

export enum KeyCode {
  Enter = 13,
  LeftArrow = 37,
  UpArrow = 38,
  RightArrow = 39,
  DownArrow = 40,
  Insert = 45,
  Home = 36,
  End = 35,
  PageDown = 34,
  PageUp = 33,
  Backspace = 8,
  Delete = 46,
  Tab = 9,
  F1 = 112,
  F2 = 113,
  F3 = 114,
  F4 = 115,
  F5 = 116,
  F6 = 117,
  F7 = 118,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  F12 = 123,
  Escape = 27,
  Space = 32,
  Shift = 16,
  Control = 17,
  Alt = 18
}

export enum Month {
  Jan = 1,
  Feb = 2,
  Mar = 3,
  Apr = 4,
  May = 5,
  Jun = 6,
  Jul = 7,
  Aug = 8,
  Sep = 9,
  Oct = 10,
  Nov = 11,
  Dec = 12
}

export function keyEventToString(keyEvent: KeyEvent): string {
  switch (keyEvent.keyCode) {
    case KeyCode.LeftArrow:
    case KeyCode.UpArrow:
    case KeyCode.RightArrow:
    case KeyCode.DownArrow:
    case KeyCode.Insert:
    case KeyCode.Home:
    case KeyCode.End:
    case KeyCode.PageDown:
    case KeyCode.PageUp:
    case KeyCode.Backspace:
    case KeyCode.Delete:
    case KeyCode.Tab:
    case KeyCode.F1:
    case KeyCode.F2:
    case KeyCode.F3:
    case KeyCode.F4:
    case KeyCode.F5:
    case KeyCode.F6:
    case KeyCode.F7:
    case KeyCode.F8:
    case KeyCode.F9:
    case KeyCode.F10:
    case KeyCode.F11:
    case KeyCode.F12:
    case KeyCode.Escape:
      return KeyCode[keyEvent.keyCode];
    case KeyCode.Enter:
      return '\n';
    case KeyCode.Space:
      return ' ';
    case KeyCode.Shift: {
      if (keyEvent.code === 'ShiftLeft') {
        return 'LeftShift';
      }
      return 'RightShift';
    }
    case KeyCode.Control: {
      if (keyEvent.code === 'ControlLeft') {
        return 'LeftControl';
      }
      return 'RightControl';
    }
    case KeyCode.Alt: {
      if (keyEvent.code === 'AltLeft') {
        return 'LeftAlt';
      }
      return 'RightAlt';
    }
    default:
      return String.fromCharCode(keyEvent.keyCode).toLowerCase();
  }
}

export function formatColumns(columns: string): string {
  const list = columns.replace(/\\n/g, '\n').split('\n');
  const v: Array<Array<string>> = [];
  const l: Array<number> = [];

  for (let i = 0; i < list.length; i++) {
    const rows = list[i].split(/\s+/);
    v.push([]);

    for (let j = 0; j < rows.length; j++) {
      if (rows.length > l.length) {
        l.push(j);
      }
      const txt = rows[j];

      if (txt.length > l[j]) {
        l[j] = txt.length;
      }

      v[i].push(txt);
    }
  }

  const seperation = 2;
  const lines = [];

  for (let i = 0; i < v.length; i++) {
    let output = '';
    for (let j = 0; j < v[i].length; j++) {
      const txt = v[i][j];
      output += txt;
      const len = l[j] - txt.length + seperation;
      output += ' '.repeat(len);
    }
    lines.push(output);
  }

  return lines.join('\r\n');
}

export function isAlphaNumeric(str: string): boolean {
  return /^[a-z0-9]+$/i.test(str);
}

export function greaterThanContentLimit(str: string): boolean {
  return str.length > 160000;
}

export function greaterThanEntityNameLimit(str: string): boolean {
  return str.length > 15;
}

export function greaterThanProcNameLimit(str: string): boolean {
  return str.length > 24;
}

export function greaterThanFileNameLimit(str: string): boolean {
  return str.length > 128;
}

export function greaterThanFilesLimit(arr: Map<any, any>): boolean {
  return arr.size > 3125;
}

export function greaterThanFoldersLimit(arr: Map<any, any>): boolean {
  return arr.size > 250;
}

export function isValidFileName(str: string): boolean {
  return /^[a-z0-9_.-]+$/i.test(str);
}

export function isValidProcName(str: string): boolean {
  return ['dsession', 'kernel_task', 'xorg', 'ssh_enc'].includes(str);
}

export function delay(time: number = 1000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

const { spawn } = require('child_process');
const path = require('path');

// 删除 ELECTRON_RUN_AS_NODE 环境变量
delete process.env.ELECTRON_RUN_AS_NODE;

const command = process.argv[2];
const projectDir = path.resolve(__dirname, '..');

let cmd, args;

switch (command) {
  case 'dev':
    cmd = 'electron-vite';
    args = ['dev'];
    break;
  case 'preview':
    cmd = 'electron-vite';
    args = ['preview'];
    break;
  case 'start':
    cmd = require('electron');
    args = ['.'];
    break;
  default:
    console.error('Unknown command:', command);
    process.exit(1);
}

const child = spawn(cmd, args, {
  cwd: projectDir,
  stdio: 'inherit',
  shell: command !== 'start',
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: undefined,
  },
});

child.on('close', (code) => {
  process.exit(code);
});

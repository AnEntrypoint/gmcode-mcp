import { spawn } from 'child_process';

const child = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
child.stdout.on('data', (data) => {
  output += data.toString();
});

let stderrOutput = '';
child.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

const callToolRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'push',
    arguments: {
      filename: 'test-file.js',
      contents: 'console.log("hello from gmcode");'
    }
  }
};

setTimeout(() => {
  child.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  setTimeout(() => {
    child.stdin.write(JSON.stringify(callToolRequest) + '\n');
    
    setTimeout(() => {
      child.kill();
      console.log('=== STDOUT ===');
      console.log(output);
      if (stderrOutput) {
        console.log('=== STDERR ===');
        console.log(stderrOutput);
      }
      process.exit(0);
    }, 3000);
  }, 1000);
}, 500);

setTimeout(() => {
  console.error('Test timeout');
  child.kill();
  process.exit(1);
}, 10000);

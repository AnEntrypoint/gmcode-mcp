import { spawn } from 'child_process';

const child = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('GOT OUTPUT:', data.toString().slice(0, 200));
});

let stderrOutput = '';
child.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

const callToolRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'push',
    arguments: {
      filename: 'example.js',
      contents: 'console.log("test from gmcode-mcp");'
    }
  }
};

setTimeout(() => {
  child.stdin.write(JSON.stringify(callToolRequest) + '\n');
  
  setTimeout(() => {
    child.kill();
    console.log('\n=== FULL OUTPUT ===');
    console.log(output);
    if (stderrOutput) {
      console.log('=== STDERR ===');
      console.log(stderrOutput);
    }
    process.exit(0);
  }, 5000);
}, 500);

setTimeout(() => {
  console.error('Test timeout');
  child.kill();
  process.exit(1);
}, 15000);

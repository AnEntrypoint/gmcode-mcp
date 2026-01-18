import { spawn } from 'child_process';

const child = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let closed = false;

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

child.on('close', (code) => {
  closed = true;
  console.log('CLOSED:', code);
});

const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0.0' }
  }
};

setTimeout(() => {
  console.log('Sending init...');
  child.stdin.write(JSON.stringify(initRequest) + '\n');
  
  setTimeout(() => {
    console.log('Sending notification...');
    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');
    
    setTimeout(() => {
      console.log('Output so far:');
      console.log(output);
      child.kill();
    }, 2000);
  }, 1000);
}, 500);

setTimeout(() => {
  child.kill();
  process.exit(1);
}, 10000);

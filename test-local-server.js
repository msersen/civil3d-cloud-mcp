#!/usr/bin/env node

/**
 * test-local-server.js
 * 
 * Quick test script to verify the Node.js server is working
 * and can receive commands as if from the C# client.
 * 
 * Usage: node test-local-server.js
 */

import WebSocket from 'ws';

console.log('[Test Client] Starting local server test...\n');

// Test 1: Health Check
console.log('Test 1: Health Check');
console.log('-------------------');

fetch('http://localhost:8080/health')
  .then(res => res.json())
  .then(data => {
    console.log('✓ Server is running');
    console.log('  Status:', data.status);
    console.log('  Time:', data.timestamp);
    console.log();
    
    // Test 2: WebSocket Connection
    runWebSocketTest();
  })
  .catch(err => {
    console.error('✗ Server not responding');
    console.error('  Error:', err.message);
    console.error('\n  Make sure to start the server first:');
    console.error('  cd C:\\Projects\\landsurv-ai\\c3dmcp-server');
    console.error('  node build/index.js');
    process.exit(1);
  });

function runWebSocketTest() {
  console.log('Test 2: WebSocket Connection');
  console.log('---------------------------');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  let sessionId = null;
  
  ws.on('open', () => {
    console.log('✓ WebSocket connected');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'session_info') {
        sessionId = message.sessionId;
        console.log('✓ Received session info');
        console.log('  Session ID:', sessionId);
        console.log();
        
        // Test 3: Send a prompt
        runPromptTest(ws, sessionId);
      } else if (message.type === 'command') {
        console.log('\nTest 3: Receive Command');
        console.log('----------------------');
        console.log('✓ Server sent command');
        console.log('  Tool:', message.tool);
        console.log('  Args:', JSON.stringify(message.args, null, 2));
        console.log('  Request ID:', message.requestId);
        console.log();
        
        // Simulate C# client sending result back
        console.log('Test 4: Send Result Back');
        console.log('----------------------');
        ws.send(JSON.stringify({
          type: 'result',
          requestId: message.requestId,
          data: {
            success: true,
            message: 'Point created successfully: #1 at (1000, 2000, 100)',
            timestamp: new Date().toISOString()
          }
        }));
        console.log('✓ Result sent back to server');
        console.log();
      } else if (message.type === 'response') {
        console.log('✓ Received AI response');
        console.log('  Message:', message.message);
        console.log();
        console.log('All tests passed! ✓');
        console.log('\nSummary:');
        console.log('--------');
        console.log('✓ Server is running');
        console.log('✓ WebSocket connection works');
        console.log('✓ Session management works');
        console.log('✓ Command flow works');
        console.log('\nReady for C# client testing!');
        ws.close();
        process.exit(0);
      }
    } catch (err) {
      console.error('Error parsing message:', err.message);
      ws.close();
      process.exit(1);
    }
  });
  
  ws.on('error', (error) => {
    console.error('✗ WebSocket error:', error.message);
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('WebSocket closed');
  });
  
  // Timeout
  setTimeout(() => {
    console.error('✗ Test timeout - no response from server');
    ws.close();
    process.exit(1);
  }, 30000);
}

function runPromptTest(ws, sessionId) {
  console.log('Test 3: Send Prompt');
  console.log('------------------');
  console.log('✓ Sending prompt to server...');
  
  ws.send(JSON.stringify({
    type: 'prompt',
    prompt: 'Create a COGO point at coordinates 1000 easting, 2000 northing with elevation 100 meters'
  }));
}

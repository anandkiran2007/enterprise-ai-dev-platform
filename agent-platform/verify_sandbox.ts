
import { ExecutionSandbox } from './src/core/sandbox';
import * as path from 'path';
import * as fs from 'fs';

async function verify() {
    console.log('--- Verifying Sandbox ---');
    const sandbox = ExecutionSandbox.getInstance();

    // 1. Basic Execution
    console.log('Test 1: Basic Calculation');
    const result1 = await sandbox.runScript('node:18-alpine', 'node -e "console.log(5 + 5)"');
    console.log('Result:', result1);

    if (result1.stdout.trim() === '10') {
        console.log('✅ Basic Execution Passed');
    } else {
        console.error('❌ Basic Execution Failed');
    }

    // 2. Volume Mount
    console.log('\nTest 2: Volume Mount');
    const tempDir = path.join(process.cwd(), 'temp_test_vol');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    fs.writeFileSync(path.join(tempDir, 'data.txt'), 'Hello from Host');

    const result2 = await sandbox.runScript(
        'node:18-alpine',
        'cat /app/data.txt',
        tempDir
    );
    console.log('Result:', result2);

    if (result2.stdout.trim() === 'Hello from Host') {
        console.log('✅ Volume Mount Passed');
    } else {
        console.error('❌ Volume Mount Failed');
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
}

verify().catch(console.error);


import Docker from 'dockerode';
import * as path from 'path';
import * as fs from 'fs';

export interface SandboxResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
}

export class ExecutionSandbox {
    private docker: Docker;
    private static instance: ExecutionSandbox;

    private constructor() {
        this.docker = new Docker();
    }

    public static getInstance(): ExecutionSandbox {
        if (!ExecutionSandbox.instance) {
            ExecutionSandbox.instance = new ExecutionSandbox();
        }
        return ExecutionSandbox.instance;
    }

    public async runScript(
        image: string,
        script: string,
        workDir?: string,
        timeoutMs: number = 30000,
        networkEnabled: boolean = false
    ): Promise<SandboxResult> {
        const startTime = Date.now();
        console.log(`[Sandbox] Preparing to run in ${image}...`);

        let container: Docker.Container | null = null;

        try {
            await this.ensureImage(image);

            let cmd = ['sh', '-c', script];
            const createOptions: Docker.ContainerCreateOptions = {
                Image: image,
                Cmd: cmd,
                Tty: false,
                HostConfig: {
                    AutoRemove: false, // Manual removal
                    Memory: 1024 * 1024 * 1024, // Increased to 1GB for Browser
                    NetworkMode: networkEnabled ? 'host' : 'none', // Allow host networking for localhost access
                }
            };

            if (workDir && fs.existsSync(workDir)) {
                createOptions.HostConfig!.Binds = [`${workDir}:/app`];
                createOptions.WorkingDir = '/app';
            }

            console.log(`[Sandbox] Spawning container...`);
            container = await this.docker.createContainer(createOptions);

            await container.start();
            const data = await container.wait();

            // Now logs are safe to fetch
            const logsBuffer = await container.logs({ stdout: true, stderr: true });

            // Clean control characters from Docker logs (stream headers)
            // Docker uses an 8-byte header for each frame. Simplistic cleaning:
            const rawLogs = logsBuffer.toString('utf8');
            // Remove non-printable characters except newlines
            const stdout = rawLogs.replace(/[^\x20-\x7E\n]/g, '');

            const durationMs = Date.now() - startTime;
            console.log(`[Sandbox] Execution finished in ${durationMs}ms. Exit: ${data.StatusCode}`);

            return {
                stdout: stdout,
                stderr: '',
                exitCode: data.StatusCode,
                durationMs
            };

        } catch (error: any) {
            console.error('[Sandbox] Error:', error);
            return {
                stdout: '',
                stderr: error.message || 'Sandbox Error',
                exitCode: -1,
                durationMs: Date.now() - startTime
            };
        } finally {
            if (container) {
                try {
                    await container.remove({ force: true });
                } catch (e) {
                    console.error('[Sandbox] Failed to remove container:', e);
                }
            }
        }
    }

    private async ensureImage(image: string): Promise<void> {
        try {
            const imageObj = this.docker.getImage(image);
            await imageObj.inspect();
        } catch (e) {
            console.log(`[Sandbox] Image ${image} not found locally. Pulling...`);
            await new Promise((resolve, reject) => {
                this.docker.pull(image, (err: any, stream: any) => {
                    if (err) return reject(err);
                    this.docker.modem.followProgress(stream, (err, res) => {
                        if (err) return reject(err);
                        resolve(res);
                    });
                });
            });
            console.log(`[Sandbox] Image ${image} pulled successfully.`);
        }
    }
}

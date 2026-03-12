const path = require('node:path');
const readline = require('node:readline');
const { spawn } = require('node:child_process');

const killPort = require('kill-port');

const repoRoot = process.cwd();
const backendDir = path.join(repoRoot, 'backend');
const frontendDir = path.join(repoRoot, 'frontend');

const prismaCli = require.resolve('prisma/build/index.js', { paths: [backendDir] });
const nestCli = require.resolve('@nestjs/cli/bin/nest.js', { paths: [backendDir] });
const cracoStart = require.resolve('@craco/craco/dist/scripts/start.js', {
  paths: [frontendDir],
});

const services = [];
let shuttingDown = false;
let shutdownPromptActive = false;
let shutdownPrompt = null;

function pipeOutput(stream, name) {
  const rl = readline.createInterface({ input: stream });
  rl.on('line', (line) => {
    console.log(`[${name}] ${line}`);
  });
}

function spawnNodeProcess(name, args, cwd, env = {}) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  pipeOutput(child.stdout, name);
  pipeOutput(child.stderr, name);

  return child;
}

function createService(name, args, cwd, env = {}) {
  return {
    name,
    args,
    cwd,
    env,
    process: null,
    pendingRestart: false,
  };
}

async function releasePort(port) {
  try {
    await killPort(port);
    console.log(`[dev] Released port ${port}`);
  } catch {
    console.log(`[dev] Port ${port} was already free`);
  }
}

async function preparePorts() {
  await releasePort(3000);
  await releasePort(3001);
}

function runPrismaGenerate() {
  return new Promise((resolve, reject) => {
    const child = spawnNodeProcess(
      'backend',
      [prismaCli, 'generate', '--schema', 'prisma/schema.prisma'],
      backendDir,
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Prisma generate failed with exit code ${code ?? 1}`));
    });

    child.on('error', reject);
  });
}

function terminateProcessTree(pid) {
  return new Promise((resolve) => {
    if (!pid) {
      resolve();
      return;
    }

    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
      });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
      return;
    }

    try {
      process.kill(-pid, 'SIGTERM');
    } catch {}
    resolve();
  });
}

async function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (shutdownPrompt) {
    shutdownPrompt.close();
    shutdownPrompt = null;
  }
  shutdownPromptActive = false;

  await Promise.all(
    services
      .filter((service) => service.process && service.process.exitCode === null)
      .map((service) => terminateProcessTree(service.process.pid)),
  );

  process.exit(exitCode);
}

function attachServiceListeners(service) {
  service.process.on('exit', (code, signal) => {
    const detail = signal ? `signal ${signal}` : `exit code ${code ?? 1}`;
    service.process = null;

    if (shuttingDown) {
      return;
    }

    if (shutdownPromptActive) {
      service.pendingRestart = true;
      console.log(
        `[dev] ${service.name} stopped with ${detail} while shutdown confirmation is pending.`,
      );
      return;
    }

    console.log(`[dev] ${service.name} stopped with ${detail}. Stopping remaining services.`);
    void shutdown(code ?? 1);
  });

  service.process.on('error', (error) => {
    service.process = null;

    if (shuttingDown) {
      return;
    }

    console.error(`[dev] ${service.name} failed to start: ${error.message}`);
    void shutdown(1);
  });
}

function startService(service) {
  if (service.process && service.process.exitCode === null) {
    return;
  }

  service.pendingRestart = false;
  service.process = spawnNodeProcess(service.name, service.args, service.cwd, service.env);
  attachServiceListeners(service);
}

function restartStoppedServices() {
  for (const service of services) {
    if (service.pendingRestart || !service.process || service.process.exitCode !== null) {
      console.log(`[dev] Restarting ${service.name}.`);
      startService(service);
    }
  }
}

function promptForShutdown() {
  if (shuttingDown || shutdownPromptActive) {
    return;
  }

  if (!process.stdin.readable) {
    console.log('[dev] Received Ctrl+C. Stopping services.');
    void shutdown(0);
    return;
  }

  shutdownPromptActive = true;
  process.stdin.resume();

  shutdownPrompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  shutdownPrompt.question('\n[dev] Stop dev servers? (Y/N) ', (answer) => {
    shutdownPrompt?.close();
    shutdownPrompt = null;
    shutdownPromptActive = false;

    const normalized = answer.trim().toLowerCase();

    if (normalized === 'y' || normalized === 'yes') {
      void shutdown(0);
      return;
    }

    if (normalized === 'n' || normalized === 'no') {
      console.log('[dev] Continuing development servers.');
      restartStoppedServices();
      return;
    }

    console.log('[dev] Please answer Y or N.');
    promptForShutdown();
  });

  shutdownPrompt.on('SIGINT', () => {
    shutdownPrompt?.write('\n');
  });
}

function startServices() {
  const backend = createService('backend', [nestCli, 'start', '--watch'], backendDir, {
    NODE_ENV: 'local',
  });

  const frontend = createService('frontend', [cracoStart], frontendDir);

  services.push(backend, frontend);

  for (const service of services) {
    startService(service);
  }
}

process.on('SIGINT', promptForShutdown);

process.on('SIGTERM', () => {
  void shutdown(0);
});

void (async () => {
  try {
    await preparePorts();
    await runPrismaGenerate();
    startServices();
  } catch (error) {
    console.error(`[dev] ${error instanceof Error ? error.message : String(error)}`);
    await shutdown(1);
  }
})();

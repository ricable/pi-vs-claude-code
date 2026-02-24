#!/usr/bin/env node

/**
 * local-inf CLI - Local inference management for WASM-AI
 *
 * Manages local AI models in Incus sandboxes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Colors
const green = chalk.green;
const yellow = chalk.yellow;
const red = chalk.red;
const blue = chalk.blue;
const cyan = chalk.cyan;

// Helper: Run command in Colima
function colimaExec(command) {
  try {
    return execSync(command, { encoding: 'utf-8' });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

// Helper: Run command in container
function containerExec(container, command) {
  return colimaExec(`incus exec ${container} -- ${command}`);
}

// List containers
async function listContainers() {
  const spinner = ora('Listing containers...').start();

  try {
    const output = colimaExec("incus list --format csv -c n -- 'cc-mirror.*' 2>/dev/null || echo ''");
    const containers = output.trim().split('\n').filter(c => c);

    spinner.succeed('Containers found');

    if (containers.length === 0) {
      console.log(yellow('No cc-mirror containers found'));
      return;
    }

    console.log(cyan('\nAvailable Containers:'));
    containers.forEach(c => console.log(`  - ${green(c)}`));

  } catch (error) {
    spinner.fail(error.message);
  }
}

// List models
async function listModels(container) {
  const spinner = ora(`Listing models in ${container}...`).start();

  try {
    const output = containerExec(container, 'ls -la /models/ 2>/dev/null || echo "No models directory"');
    spinner.succeed();
    console.log(cyan('\nModels:'));
    console.log(output);
  } catch (error) {
    spinner.fail(error.message);
  }
}

// Start Ollama
async function startOllama(container) {
  const spinner = ora(`Starting Ollama in ${container}...`).start();

  try {
    containerExec(container, 'ollama serve &');
    spinner.succeed('Ollama started');

    // Wait a bit and check
    await new Promise(r => setTimeout(r, 2000));
    const status = containerExec(container, 'curl -s http://localhost:11434/ 2>/dev/null || echo "not ready"');

    if (status.includes('Ollama')) {
      console.log(green('Ollama is running'));
    } else {
      console.log(yellow('Ollama may not be ready yet'));
    }
  } catch (error) {
    spinner.fail(error.message);
  }
}

// Pull model
async function pullModel(container, model) {
  const spinner = ora(`Pulling ${model} in ${container}...`).start();

  try {
    containerExec(container, `ollama pull ${model}`);
    spinner.succeed(`Model ${model} pulled successfully`);
  } catch (error) {
    spinner.fail(error.message);
  }
}

// Run model
async function runModel(container, model, prompt) {
  const spinner = ora(`Running ${model} in ${container}...`).start();

  try {
    if (prompt) {
      const output = containerExec(container, `ollama run ${model} "${prompt}"`);
      spinner.succeed();
      console.log(cyan('\nResponse:'));
      console.log(output);
    } else {
      spinner.succeed('Container ready for interactive use');
      console.log(green(`\nRun: incus exec ${container} -- ollama run ${model}`));
    }
  } catch (error) {
    spinner.fail(error.message);
  }
}

// Check WASM runtime
async function checkWasm(container) {
  const spinner = ora(`Checking WASM runtime in ${container}...`).start();

  try {
    const wasmtime = containerExec(container, 'wasmtime --version 2>/dev/null || echo "not installed"').trim();
    const spin = containerExec(container, 'spin --version 2>/dev/null || echo "not installed"').trim();

    spinner.succeed();

    console.log(cyan('\nWASM Runtime:'));
    console.log(`  wasmtime: ${wasmtime.includes('not') ? yellow(wasmtime) : green(wasmtime)}`);
    console.log(`  spin:     ${spin.includes('not') ? yellow(spin) : green(spin)}`);
  } catch (error) {
    spinner.fail(error.message);
  }
}

// Status command
async function status(container) {
  const spinner = ora(`Checking status of ${container}...`).start();

  try {
    const info = colimaExec(`incus info ${container} 2>/dev/null`);
    spinner.succeed();

    console.log(cyan('\nContainer Status:'));
    // Parse and show relevant info
    const lines = info.split('\n');
    let inConfig = false;
    lines.forEach(line => {
      if (line.startsWith('Status:')) {
        const status = line.includes('Running') ? green(line) : red(line);
        console.log(`  ${status}`);
      }
      if (line.startsWith('Memory:')) console.log(`  ${cyan(line)}`);
      if (line.startsWith('CPU:')) console.log(`  ${cyan(line)}`);
    });
  } catch (error) {
    spinner.fail(error.message);
  }
}

// Main program
program
  .name('local-inf')
  .description('Local inference management for WASM-AI Incus sandboxes')
  .version('1.0.0');

// List command
program
  .command('list')
  .description('List all cc-mirror containers')
  .action(listContainers);

// Models command
program
  .command('models')
  .description('List models in a container')
  .argument('[container]', 'Container name', 'cc-mirror-ccollama')
  .action(listModels);

// Ollama command
program
  .command('ollama')
  .description('Ollama management')
  .argument('<action>', 'Action: start, stop, list')
  .argument('[container]', 'Container name', 'cc-mirror-ccollama')
  .argument('[model]', 'Model name (for pull/run)', '')
  .action(async (action, container, model) => {
    if (action === 'start') {
      await startOllama(container);
    } else if (action === 'pull' && model) {
      await pullModel(container, model);
    } else if (action === 'run' && model) {
      await runModel(container, model, '');
    } else {
      console.log(yellow('Unknown action or missing model'));
    }
  });

// Run command
program
  .command('run')
  .description('Run a model with a prompt')
  .argument('<container>', 'Container name')
  .argument('<model>', 'Model name')
  .argument('[prompt]', 'Prompt to run')
  .action(runModel);

// Wasm command
program
  .command('wasm')
  .description('Check WASM runtime')
  .argument('[container]', 'Container name', 'all')
  .action(async (container) => {
    if (container === 'all') {
      const output = colimaExec("incus list --format csv -c n -- 'cc-mirror.*' 2>/dev/null || echo ''");
      const containers = output.trim().split('\n').filter(c => c);
      for (const c of containers) {
        await checkWasm(c);
      }
    } else {
      await checkWasm(container);
    }
  });

// Status command
program
  .command('status')
  .description('Check container status')
  .argument('[container]', 'Container name', 'all')
  .action(async (container) => {
    if (container === 'all') {
      await listContainers();
    } else {
      await status(container);
    }
  });

// Parse arguments
program.parse();

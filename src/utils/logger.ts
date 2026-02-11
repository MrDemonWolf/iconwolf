import chalk from 'chalk';
import type { GenerationResult } from '../types.js';

export function banner(): void {
  console.log(
    chalk.bold.hex('#FF6B35')('\n  iconwolf') +
      chalk.dim(' - app icon generator\n'),
  );
}

export function info(message: string): void {
  console.log(chalk.blue('  info') + chalk.dim(' · ') + message);
}

export function success(message: string): void {
  console.log(chalk.green('  done') + chalk.dim(' · ') + message);
}

export function generated(result: GenerationResult): void {
  const sizeKB = (result.size / 1024).toFixed(1);
  console.log(
    chalk.green('  generated') +
      chalk.dim(' · ') +
      chalk.white(result.filePath) +
      chalk.dim(` (${result.width}x${result.height}, ${sizeKB} KB)`),
  );
}

export function warn(message: string): void {
  console.log(chalk.yellow('  warn') + chalk.dim(' · ') + message);
}

export function error(message: string): void {
  console.error(chalk.red('  error') + chalk.dim(' · ') + message);
}

export function summary(results: GenerationResult[]): void {
  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  const totalKB = (totalSize / 1024).toFixed(1);
  console.log(
    chalk.bold(
      `\n  ${results.length} file${results.length === 1 ? '' : 's'} generated`,
    ) + chalk.dim(` (${totalKB} KB total)\n`),
  );
}

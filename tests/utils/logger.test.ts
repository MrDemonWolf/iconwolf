import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as logger from '../../src/utils/logger.js';

let logOutput: string[];
let errorOutput: string[];

beforeEach(() => {
  logOutput = [];
  errorOutput = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logOutput.push(args.map(String).join(' '));
  });
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errorOutput.push(args.map(String).join(' '));
  });
});

describe('banner', () => {
  it('prints the iconwolf banner', () => {
    logger.banner();
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0]).toContain('iconwolf');
    expect(logOutput[0]).toContain('app icon generator');
  });
});

describe('info', () => {
  it('prints an info message', () => {
    logger.info('test message');
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0]).toContain('info');
    expect(logOutput[0]).toContain('test message');
  });
});

describe('success', () => {
  it('prints a success message', () => {
    logger.success('operation complete');
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0]).toContain('done');
    expect(logOutput[0]).toContain('operation complete');
  });
});

describe('generated', () => {
  it('prints file path and dimensions', () => {
    logger.generated({
      filePath: '/output/icon.png',
      width: 1024,
      height: 1024,
      size: 6800,
    });
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0]).toContain('generated');
    expect(logOutput[0]).toContain('/output/icon.png');
    expect(logOutput[0]).toContain('1024x1024');
    expect(logOutput[0]).toContain('6.6 KB');
  });

  it('formats sub-KB sizes', () => {
    logger.generated({
      filePath: '/output/favicon.png',
      width: 48,
      height: 48,
      size: 400,
    });
    expect(logOutput[0]).toContain('0.4 KB');
  });
});

describe('warn', () => {
  it('prints a warning message', () => {
    logger.warn('something off');
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0]).toContain('warn');
    expect(logOutput[0]).toContain('something off');
  });
});

describe('error', () => {
  it('prints to stderr', () => {
    logger.error('something broke');
    expect(errorOutput).toHaveLength(1);
    expect(errorOutput[0]).toContain('error');
    expect(errorOutput[0]).toContain('something broke');
  });

  it('does not print to stdout', () => {
    logger.error('fail');
    expect(logOutput).toHaveLength(0);
  });
});

describe('summary', () => {
  it('prints file count and total size', () => {
    logger.summary([
      { filePath: '/a.png', width: 1024, height: 1024, size: 5000 },
      { filePath: '/b.png', width: 1024, height: 1024, size: 3000 },
    ]);
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0]).toContain('2 files generated');
    expect(logOutput[0]).toContain('7.8 KB total');
  });

  it('uses singular for one file', () => {
    logger.summary([
      { filePath: '/a.png', width: 1024, height: 1024, size: 1024 },
    ]);
    expect(logOutput[0]).toContain('1 file generated');
    expect(logOutput[0]).not.toContain('files');
  });
});

describe('updateNotice', () => {
  it('prints version upgrade info', () => {
    logger.updateNotice('0.0.6', '0.0.7');
    expect(logOutput).toHaveLength(2);
    expect(logOutput[0]).toContain('update');
    expect(logOutput[0]).toContain('0.0.6');
    expect(logOutput[0]).toContain('0.0.7');
    expect(logOutput[0]).toContain('New version available');
  });

  it('includes brew upgrade instruction', () => {
    logger.updateNotice('0.0.6', '0.0.7');
    expect(logOutput[1]).toContain('brew upgrade iconwolf');
  });
});

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  isIconComposerFolder,
  renderIconComposerFolder,
} from '../../src/utils/icon-composer.js';
import { createTmpDir, cleanDir } from '../helpers.js';

let tmpDir: string;

beforeAll(() => {
  tmpDir = createTmpDir();
});

afterAll(() => {
  cleanDir(tmpDir);
});

/**
 * Create a mock .icon folder with a gradient background and a simple layer.
 */
async function createMockIconFolder(
  dir: string,
  opts?: { solidFill?: boolean; noFill?: boolean },
): Promise<string> {
  const iconDir = path.join(dir, 'TestIcon.icon');
  const assetsDir = path.join(iconDir, 'Assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // Create a 200x200 test layer image
  await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 },
    },
  })
    .png()
    .toFile(path.join(assetsDir, 'layer.png'));

  let fill: unknown;
  if (opts?.solidFill) {
    fill = { solid: 'srgb:1.00000,0.00000,0.00000,1.00000' };
  } else if (opts?.noFill) {
    fill = {};
  } else {
    fill = {
      'linear-gradient': [
        'display-p3:0.00000,0.67451,0.92941,1.00000',
        'display-p3:0.03529,0.08235,0.20000,1.00000',
      ],
      orientation: {
        start: { x: 0.5, y: 0 },
        stop: { x: 0.5, y: 0.7 },
      },
    };
  }

  const manifest = {
    fill,
    groups: [
      {
        layers: [
          {
            'image-name': 'layer.png',
            name: 'layer',
            position: {
              scale: 1.0,
              'translation-in-points': [0, 0],
            },
          },
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(iconDir, 'icon.json'),
    JSON.stringify(manifest, null, 2),
  );

  return iconDir;
}

describe('isIconComposerFolder', () => {
  it('returns true for valid .icon folder', async () => {
    const iconDir = await createMockIconFolder(path.join(tmpDir, 'valid'));
    expect(isIconComposerFolder(iconDir)).toBe(true);
  });

  it('returns false for non-.icon path', () => {
    expect(isIconComposerFolder('/tmp/test.png')).toBe(false);
  });

  it('returns false for .icon file that is not a directory', () => {
    const fakePath = path.join(tmpDir, 'fake.icon');
    fs.writeFileSync(fakePath, 'not a directory');
    expect(isIconComposerFolder(fakePath)).toBe(false);
  });

  it('returns false for .icon directory without icon.json', () => {
    const emptyDir = path.join(tmpDir, 'empty.icon');
    fs.mkdirSync(emptyDir, { recursive: true });
    expect(isIconComposerFolder(emptyDir)).toBe(false);
  });
});

describe('renderIconComposerFolder', () => {
  it('renders a gradient .icon folder to 1024x1024 PNG', async () => {
    const iconDir = await createMockIconFolder(
      path.join(tmpDir, 'render-gradient'),
    );
    const result = await renderIconComposerFolder(iconDir);

    expect(fs.existsSync(result.composedImagePath)).toBe(true);

    const meta = await sharp(result.composedImagePath).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);
    expect(meta.format).toBe('png');

    // Clean up temp file
    fs.rmSync(path.dirname(result.composedImagePath), {
      recursive: true,
      force: true,
    });
  });

  it('extracts background color from gradient', async () => {
    const iconDir = await createMockIconFolder(path.join(tmpDir, 'render-bg'));
    const result = await renderIconComposerFolder(iconDir);

    // First gradient stop: display-p3:0.00000,0.67451,0.92941 → #00ACED
    expect(result.extractedBgColor).toBe('#00ACED');

    fs.rmSync(path.dirname(result.composedImagePath), {
      recursive: true,
      force: true,
    });
  });

  it('handles solid fill', async () => {
    const iconDir = await createMockIconFolder(
      path.join(tmpDir, 'render-solid'),
      {
        solidFill: true,
      },
    );
    const result = await renderIconComposerFolder(iconDir);

    expect(result.extractedBgColor).toBe('#FF0000');

    const meta = await sharp(result.composedImagePath).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);

    fs.rmSync(path.dirname(result.composedImagePath), {
      recursive: true,
      force: true,
    });
  });

  it('falls back to white when no fill specified', async () => {
    const iconDir = await createMockIconFolder(
      path.join(tmpDir, 'render-nofill'),
      {
        noFill: true,
      },
    );
    const result = await renderIconComposerFolder(iconDir);

    expect(result.extractedBgColor).toBe('#FFFFFF');

    fs.rmSync(path.dirname(result.composedImagePath), {
      recursive: true,
      force: true,
    });
  });

  it('throws on missing layer image', async () => {
    const iconDir = path.join(tmpDir, 'missing-layer.icon');
    fs.mkdirSync(path.join(iconDir, 'Assets'), { recursive: true });
    fs.writeFileSync(
      path.join(iconDir, 'icon.json'),
      JSON.stringify({
        fill: {},
        groups: [
          {
            layers: [
              {
                'image-name': 'nonexistent.png',
                name: 'missing',
                position: { scale: 1, 'translation-in-points': [0, 0] },
              },
            ],
          },
        ],
      }),
    );

    await expect(renderIconComposerFolder(iconDir)).rejects.toThrow(
      'Layer image not found',
    );
  });
});

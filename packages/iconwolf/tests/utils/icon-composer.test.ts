import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  isIconComposerFolder,
  renderIconComposerFolder,
  createIconComposerFolder,
  hexToIconColor,
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

describe('hexToIconColor', () => {
  it('converts #FFFFFF to srgb:1.00000,1.00000,1.00000,1.00000', () => {
    expect(hexToIconColor('#FFFFFF')).toBe(
      'srgb:1.00000,1.00000,1.00000,1.00000',
    );
  });

  it('converts #000000 to srgb:0.00000,0.00000,0.00000,1.00000', () => {
    expect(hexToIconColor('#000000')).toBe(
      'srgb:0.00000,0.00000,0.00000,1.00000',
    );
  });

  it('converts #091533 correctly', () => {
    expect(hexToIconColor('#091533')).toBe(
      'srgb:0.03529,0.08235,0.20000,1.00000',
    );
  });

  it('handles 3-digit hex shorthand', () => {
    expect(hexToIconColor('#FFF')).toBe('srgb:1.00000,1.00000,1.00000,1.00000');
  });

  it('handles hex without # prefix', () => {
    expect(hexToIconColor('FF0000')).toBe(
      'srgb:1.00000,0.00000,0.00000,1.00000',
    );
  });

  it('throws on invalid hex', () => {
    expect(() => hexToIconColor('#XYZ')).toThrow('Invalid hex color');
  });
});

describe('createIconComposerFolder', () => {
  it('creates valid .icon folder structure', async () => {
    const testPng = path.join(tmpDir, 'create-test.png');
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 255 },
      },
    })
      .png()
      .toFile(testPng);

    const outputPath = path.join(tmpDir, 'Output.icon');
    const result = await createIconComposerFolder(testPng, outputPath, {
      bgColor: '#FF0000',
    });

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.existsSync(path.join(outputPath, 'icon.json'))).toBe(true);
    expect(
      fs.existsSync(path.join(outputPath, 'Assets', 'foreground.png')),
    ).toBe(true);
    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);
    expect(result.filePath).toBe(outputPath);
  });

  it('generates fill with solid color when no darkBgColor', async () => {
    const testPng = path.join(tmpDir, 'fill-test.png');
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 255 },
      },
    })
      .png()
      .toFile(testPng);

    const outputPath = path.join(tmpDir, 'FillTest.icon');
    await createIconComposerFolder(testPng, outputPath, {
      bgColor: '#FF0000',
    });

    const manifest = JSON.parse(
      fs.readFileSync(path.join(outputPath, 'icon.json'), 'utf-8'),
    );
    expect(manifest.fill).toBeDefined();
    expect(manifest.fill.solid).toBe('srgb:1.00000,0.00000,0.00000,1.00000');
    expect(manifest['fill-specializations']).toBeUndefined();
  });

  it('generates fill-specializations when darkBgColor provided', async () => {
    const testPng = path.join(tmpDir, 'dark-test.png');
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 255 },
      },
    })
      .png()
      .toFile(testPng);

    const outputPath = path.join(tmpDir, 'DarkTest.icon');
    await createIconComposerFolder(testPng, outputPath, {
      bgColor: '#FFFFFF',
      darkBgColor: '#000000',
    });

    const manifest = JSON.parse(
      fs.readFileSync(path.join(outputPath, 'icon.json'), 'utf-8'),
    );
    expect(manifest.fill).toBeUndefined();
    expect(manifest['fill-specializations']).toHaveLength(2);
    expect(manifest['fill-specializations'][0].appearance).toBeUndefined();
    expect(manifest['fill-specializations'][0].value.solid).toBe(
      'srgb:1.00000,1.00000,1.00000,1.00000',
    );
    expect(manifest['fill-specializations'][1].appearance).toBe('dark');
    expect(manifest['fill-specializations'][1].value.solid).toBe(
      'srgb:0.00000,0.00000,0.00000,1.00000',
    );
  });

  it('copies foreground image to Assets/', async () => {
    const testPng = path.join(tmpDir, 'copy-test.png');
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 255 },
      },
    })
      .png()
      .toFile(testPng);

    const outputPath = path.join(tmpDir, 'CopyTest.icon');
    await createIconComposerFolder(testPng, outputPath, { bgColor: '#FFFFFF' });

    const foregroundPath = path.join(outputPath, 'Assets', 'foreground.png');
    expect(fs.existsSync(foregroundPath)).toBe(true);

    // Verify it's a valid PNG with correct dimensions
    const meta = await sharp(foregroundPath).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  it('round-trips: created folder renders via renderIconComposerFolder()', async () => {
    const testPng = path.join(tmpDir, 'roundtrip-src.png');
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 100, g: 150, b: 200, alpha: 255 },
      },
    })
      .png()
      .toFile(testPng);

    const outputPath = path.join(tmpDir, 'RoundTrip.icon');
    await createIconComposerFolder(testPng, outputPath, {
      bgColor: '#091533',
    });

    // Verify the created folder is recognized as a valid .icon folder
    expect(isIconComposerFolder(outputPath)).toBe(true);

    // Render the created folder
    const rendered = await renderIconComposerFolder(outputPath);
    expect(fs.existsSync(rendered.composedImagePath)).toBe(true);

    const meta = await sharp(rendered.composedImagePath).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);
    expect(meta.format).toBe('png');

    // Clean up temp render
    fs.rmSync(path.dirname(rendered.composedImagePath), {
      recursive: true,
      force: true,
    });
  });
});

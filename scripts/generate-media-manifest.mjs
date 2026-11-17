import { readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const mediaRoot = join(root, 'assets');
const output = join(root, 'data', 'media-manifest.json');
const image = /\.(avif|gif|jpe?g|png|webp)$/i;
const video = /\.(mp4|webm)$/i;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else if (image.test(entry.name) || video.test(entry.name)) result.push(path);
  }
  return result;
}

const manifest = {};
for (const category of ['creation', 'production']) {
  const categoryDir = join(mediaRoot, category);
  try {
    const projects = await readdir(categoryDir, { withFileTypes: true });
    for (const project of projects.filter(item => item.isDirectory())) {
      const folder = join(categoryDir, project.name);
      const files = (await walk(folder)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      manifest[project.name] = files.map(file => ({
        type: video.test(file) ? 'video' : 'image',
        src: `./${relative(root, file).split('\\').join('/')}`,
      }));
    }
  } catch { /* An empty category is valid during setup. */ }
}
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated media manifest for ${Object.keys(manifest).length} project(s).`);

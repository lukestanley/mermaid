import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXAMPLES } from './manual-position-data.js';

const OUTPUT_DIR = new URL('../demos/manual-positioning/', import.meta.url);
const IMG_DIR = new URL('../img/manual-positioning/', import.meta.url);
const outputDirPath = fileURLToPath(OUTPUT_DIR);
const imgDirPath = fileURLToPath(IMG_DIR);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Manual node positioning examples</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.5;
      }
      body {
        margin: 0 auto;
        padding: 2rem;
        max-width: 1200px;
        background: radial-gradient(circle at top left, rgba(80, 120, 200, 0.08), transparent 60%);
      }
      h1 {
        margin-bottom: 2rem;
        text-align: center;
        letter-spacing: 0.05em;
      }
      .example {
        margin-bottom: 3rem;
        border-bottom: 1px solid rgba(100, 100, 100, 0.3);
        padding-bottom: 2.5rem;
      }
      .pair {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      figure {
        margin: 0;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(120, 120, 120, 0.25);
        background: rgba(255, 255, 255, 0.55);
        box-shadow: 0 18px 40px rgba(15, 30, 60, 0.08);
        backdrop-filter: blur(12px);
      }
      figcaption {
        font-weight: 600;
        text-align: center;
        margin-bottom: 0.75rem;
      }
      .description {
        margin-bottom: 1rem;
        color: rgba(30, 30, 30, 0.7);
      }
      .status {
        position: fixed;
        inset: auto 1.5rem 1.5rem auto;
        background: rgba(20, 120, 80, 0.9);
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 999px;
        font-size: 0.9rem;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        display: none;
      }
      svg {
        width: 100%;
        height: auto;
      }
      pre {
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="status" id="status">Saving SVG assets…</div>
    <h1>Manual node positioning showcase</h1>
    <div id="examples"></div>
    <script id="example-data" type="application/json">${JSON.stringify(EXAMPLES)}</script>
    <script type="module">
      import mermaid from '../../packages/mermaid/dist/mermaid.esm.mjs';

      const statusEl = document.getElementById('status');
      const examples = JSON.parse(document.getElementById('example-data').textContent);
      const container = document.getElementById('examples');

      const makeDiagramBlock = (caption, id) => {
        const figure = document.createElement('figure');
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = caption;
        const wrapper = document.createElement('div');
        wrapper.dataset.diagramId = id;
        figure.append(figcaption, wrapper);
        return { figure, wrapper };
      };

      for (const example of examples) {
        const section = document.createElement('section');
        section.className = 'example';

        const title = document.createElement('h2');
        title.textContent = example.title;
        const description = document.createElement('p');
        description.className = 'description';
        description.textContent = example.description;

        const pair = document.createElement('div');
        pair.className = 'pair';

        const beforeId = example.id + '-before';
        const afterId = example.id + '-after';

        const before = makeDiagramBlock('Automatic layout', beforeId);
        const after = makeDiagramBlock('Manual coordinates', afterId);

        pair.append(before.figure, after.figure);
        section.append(title, description, pair);
        container.append(section);
      }

      await mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        flowchart: { htmlLabels: false },
        theme: 'neutral'
      });

      const outputs = [];
      for (const example of examples) {
        const beforeId = example.id + '-before';
        const afterId = example.id + '-after';

        const beforeSvg = await mermaid.render(beforeId, example.before);
        const afterSvg = await mermaid.render(afterId, example.after);

        const beforeTarget = document.querySelector('[data-diagram-id="' + beforeId + '"]');
        const afterTarget = document.querySelector('[data-diagram-id="' + afterId + '"]');
        beforeTarget.innerHTML = beforeSvg.svg;
        afterTarget.innerHTML = afterSvg.svg;

        outputs.push({ id: example.id, beforeSvg: beforeSvg.svg, afterSvg: afterSvg.svg });
      }

      async function postSVGs() {
        statusEl.style.display = 'block';
        try {
          await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examples: outputs })
          });
      statusEl.textContent = 'SVG assets saved ✓';
          statusEl.style.background = 'rgba(30, 150, 90, 0.92)';
        } catch (error) {
          statusEl.textContent = 'Failed to save SVG assets';
          statusEl.style.background = 'rgba(170, 40, 40, 0.92)';
          console.error(error);
        }
        setTimeout(() => {
          statusEl.style.opacity = '0';
          setTimeout(() => {
            statusEl.style.display = 'none';
            statusEl.style.opacity = '';
          }, 600);
        }, 2500);
      }

      postSVGs();
    </script>
  </body>
</html>`;

await mkdir(imgDirPath, { recursive: true });
await mkdir(outputDirPath, { recursive: true });
await writeFile(join(outputDirPath, 'index.html'), html, 'utf8');

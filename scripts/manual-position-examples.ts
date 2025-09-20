import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXAMPLES } from './manual-position-data.js';

const OUTPUT_DIR = new URL('../demos/dev/', import.meta.url);
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
      .controls {
        display: grid;
        gap: 0.75rem;
        margin: 0 auto 2.5rem;
        padding: 1rem 1.25rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(140, 140, 140, 0.25);
        box-shadow: 0 12px 32px rgba(20, 30, 60, 0.08);
        max-width: 560px;
      }
      .controls label {
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.8rem;
        color: rgba(30, 40, 80, 0.75);
      }
      #layout-select {
        padding: 0.55rem 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(120, 120, 120, 0.35);
        font-size: 1rem;
        background: rgba(255, 255, 255, 0.85);
        color: inherit;
      }
      #layout-description {
        margin: 0;
        color: rgba(30, 30, 30, 0.72);
        font-size: 0.95rem;
      }
      .example {
        margin-bottom: 3rem;
        border-bottom: 1px solid rgba(100, 100, 100, 0.3);
        padding-bottom: 2.5rem;
      }
      .pair {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }
      figure {
        margin: 0;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(120, 120, 120, 0.25);
        background: rgba(255, 255, 255, 0.55);
        box-shadow: 0 18px 40px rgba(15, 30, 60, 0.08);
        backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      figcaption {
        font-weight: 600;
        text-align: center;
        margin-bottom: 0;
        display: grid;
        gap: 0.25rem;
      }
      .layout-tag {
        font-weight: 500;
        font-size: 0.85rem;
        color: rgba(40, 80, 140, 0.85);
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
      .error {
        border-radius: 0.5rem;
        padding: 1rem;
        background: rgba(200, 60, 60, 0.1);
        color: rgba(120, 20, 20, 0.9);
        font-size: 0.9rem;
      }
      pre {
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="status" id="status">Saving SVG assets…</div>
    <h1>Manual node positioning showcase</h1>
    <form class="controls" id="controls">
      <label for="layout-select">Layout engine</label>
      <select id="layout-select" name="layout"></select>
      <p id="layout-description"></p>
    </form>
    <div id="examples"></div>
    <script id="example-data" type="application/json">${JSON.stringify(EXAMPLES)}</script>
    <script type="module">
      import mermaid from '/mermaid.esm.mjs';
      import layouts from '/mermaid-layout-elk.esm.mjs';

      const layoutOptions = [
        {
          value: 'dagre',
          label: 'Dagre (layered)',
          description: 'The default layered solver keeps directional graphs tidy with even spacing.',
        },
        {
          value: 'cose-bilkent',
          label: 'fCoSE (force-directed)',
          description:
            'Force-directed placement from Cytoscape spreads nodes naturally while respecting manual coordinates.',
        },
        {
          value: 'elk',
          label: 'ELK layered',
          description:
            "ELK's layered engine focuses on clear orthogonal routing and balanced layers for dense diagrams.",
        },
        {
          value: 'elk.force',
          label: 'ELK force',
          description:
            'A physics-inspired ELK layout that pairs well with manual tweaks for organic storyboards.',
        },
      ];

      mermaid.registerLayoutLoaders(layouts);

      const statusEl = document.getElementById('status');
      const layoutSelect = document.getElementById('layout-select');
      const layoutDescription = document.getElementById('layout-description');
      const examples = JSON.parse(document.getElementById('example-data').textContent);
      const container = document.getElementById('examples');

      for (const option of layoutOptions) {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        layoutSelect.append(optionEl);
      }

      const makeDiagramBlock = (caption, id) => {
        const figure = document.createElement('figure');
        const figcaption = document.createElement('figcaption');
        const captionText = document.createElement('span');
        captionText.textContent = caption;
        const layoutTag = document.createElement('span');
        layoutTag.className = 'layout-tag';
        layoutTag.dataset.layoutTag = '';
        figcaption.append(captionText, layoutTag);
        const wrapper = document.createElement('div');
        wrapper.dataset.diagramId = id;
        figure.append(figcaption, wrapper);
        return { figure, wrapper, layoutTag };
      };

      const diagramEntries = [];

      const stripToSingleOverride = (diagram) => {
        let seen = 0;
        return diagram.replace(/@[{][^}]*[}]/g, (match) => {
          seen += 1;
          return seen === 1 ? match : '';
        });
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

        const autoId = example.id + '-auto';
        const nudgeId = example.id + '-nudge';
        const manualId = example.id + '-manual';

        const auto = makeDiagramBlock('Automatic layout', autoId);
        const nudge = makeDiagramBlock('Single-node override', nudgeId);
        const manual = makeDiagramBlock('Full manual hybrid', manualId);

        pair.append(auto.figure, nudge.figure, manual.figure);
        section.append(title, description, pair);
        container.append(section);

        const singleOverride = stripToSingleOverride(example.after);

        diagramEntries.push(
          {
            id: autoId,
            exampleId: example.id,
            variant: 'auto',
            source: example.before,
            target: auto.wrapper,
            layoutTag: auto.layoutTag,
          },
          {
            id: nudgeId,
            exampleId: example.id,
            variant: 'nudge',
            source: singleOverride,
            target: nudge.wrapper,
            layoutTag: nudge.layoutTag,
          },
          {
            id: manualId,
            exampleId: example.id,
            variant: 'manual',
            source: example.after,
            target: manual.wrapper,
            layoutTag: manual.layoutTag,
          },
        );
      }

      await mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        flowchart: { htmlLabels: false },
        theme: 'neutral',
      });

      const withLayout = (diagram, layout) =>
        '%%{init: { "layout": "' + layout + '" }}%%\\n' + diagram;

      async function renderAll(layout, { captureOutputs = false } = {}) {
        const option = layoutOptions.find((item) => item.value === layout) ?? layoutOptions[0];
        layoutSelect.value = option.value;
        layoutDescription.textContent = option.description;

        const layoutLabel = option.label;
        const results = new Map();

        for (const entry of diagramEntries) {
          try {
            const rendered = await mermaid.render(entry.id, withLayout(entry.source, option.value));
            entry.target.innerHTML = rendered.svg;
            entry.layoutTag.textContent = layoutLabel;
            results.set(entry.id, rendered.svg);
          } catch (error) {
            console.error('Failed to render diagram', entry.id, error);
            entry.target.innerHTML = '<div class="error">Failed to render diagram for ' +
              option.label + '. Check console for details.</div>';
            entry.layoutTag.textContent = option.label;
          }
        }

        if (captureOutputs) {
          const grouped = new Map();
          for (const entry of diagramEntries) {
            if (!grouped.has(entry.exampleId)) {
              grouped.set(entry.exampleId, {});
            }
            const group = grouped.get(entry.exampleId);
            if (entry.variant === 'auto') {
              group.beforeSvg = results.get(entry.id) ?? '';
            }
            if (entry.variant === 'manual') {
              group.afterSvg = results.get(entry.id) ?? '';
            }
          }
          return Array.from(grouped, ([id, value]) => ({ id, beforeSvg: value.beforeSvg ?? '', afterSvg: value.afterSvg ?? '' }));
        }

        return [];
      }

      const defaultOutputs = await renderAll(layoutOptions[0].value, { captureOutputs: true });

      async function postSVGs(examples) {
        if (!examples.length) {
          return;
        }
        statusEl.style.display = 'block';
        try {
          await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examples }),
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

      layoutSelect.addEventListener('change', (event) => {
        const value = event.target.value;
        renderAll(value).catch((error) => {
          console.error('Failed to render for layout change', error);
        });
      });

      postSVGs(defaultOutputs).catch((error) => {
        console.error('Failed to post SVG assets', error);
      });
    </script>
  </body>
</html>`;

await mkdir(imgDirPath, { recursive: true });
await mkdir(outputDirPath, { recursive: true });
await writeFile(join(outputDirPath, 'manual-positioning-gallery.html'), html, 'utf8');

import { computeDragPosition } from './drag-utils.js';
import { EXAMPLES, LAYOUT_OPTIONS } from './examples.js';

/* cspell:ignore mermaidmanualpositionchange */

const manualNodePattern = /^(\s*([\w$.-]+)@{\s*position\s*:\s*)([^}]+)(\s*}.*)$/;

const defaultConfig = {
  startOnLoad: false,
  theme: 'default',
  includeLargeFeatures: true,
};

const formatNumber = (value) => {
  const rounded = Math.round(value * 10) / 10;
  if (!Number.isFinite(rounded)) {
    return '0';
  }
  return Number.isInteger(rounded)
    ? String(Math.trunc(rounded))
    : rounded.toFixed(1).replace(/\.0$/, '');
};

const formatPosition = (pos) => `[${formatNumber(pos.x)}, ${formatNumber(pos.y)}]`;

const parseCoordinateString = (raw) => {
  if (typeof raw !== 'string') {
    return null;
  }
  const cleaned = raw.replace(/[()[\]{}]/g, ' ').replace(/["']/g, ' ');
  const parts = cleaned.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  const [xStr, yStr] = parts;
  const x = Number(xStr);
  const y = Number(yStr);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
};

const normalizePosition = (pos) => {
  const x = Number(pos?.x);
  const y = Number(pos?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
  };
};

const pointerToSvgCoords = (svg, event) => {
  if (!svg) {
    return null;
  }
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const inverse = ctm.inverse();
    if (inverse) {
      const transformed = point.matrixTransform(inverse);
      if (Number.isFinite(transformed.x) && Number.isFinite(transformed.y)) {
        return { x: transformed.x, y: transformed.y };
      }
    }
  }
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox?.baseVal;
  const width = viewBox?.width ?? rect.width;
  const height = viewBox?.height ?? rect.height;
  const offsetX = viewBox?.x ?? 0;
  const offsetY = viewBox?.y ?? 0;
  const x = ((event.clientX - rect.left) * width) / rect.width + offsetX;
  const y = ((event.clientY - rect.top) * height) / rect.height + offsetY;
  return { x, y };
};

const parseTransform = (transformValue) => {
  const numberPattern = String.raw`[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?`;
  const translatePattern = String.raw`translate\((${numberPattern})[ ,](${numberPattern})\)`;
  const match = new RegExp(translatePattern).exec(transformValue ?? '');
  if (!match) {
    return { x: 0, y: 0 };
  }
  return { x: Number(match[1]) || 0, y: Number(match[2]) || 0 };
};

const getNodeId = (nodeEl) => {
  const title = nodeEl.querySelector('title');
  const fromTitle = title?.textContent?.trim();
  if (fromTitle) {
    return fromTitle;
  }
  const dataId = nodeEl.getAttribute('data-id');
  if (dataId) {
    return dataId.trim();
  }
  const rawId = nodeEl.id ?? '';
  if (!rawId) {
    return '';
  }
  const match = rawId.match(/^(?:flowchart-)?(.+?)(?:-\d+)?$/);
  return match ? match[1] : rawId;
};

export const setupManualPositioningDemo = async ({
  mermaid,
  layouts,
  examples = EXAMPLES,
  layoutOptions = LAYOUT_OPTIONS,
  config,
} = {}) => {
  if (!mermaid) {
    throw new Error('A Mermaid instance is required to setup the manual positioning demo.');
  }

  if (layouts && typeof mermaid.registerLayoutLoaders === 'function') {
    mermaid.registerLayoutLoaders(layouts);
  }

  const baseConfig = { ...defaultConfig, ...(config ?? {}) };
  mermaid.initialize(baseConfig);

  const layoutSelectEl = document.getElementById('layout-select');
  const layoutDescriptionEl = document.getElementById('layout-description');
  const selectEl = document.getElementById('example-select');
  const editorEl = document.getElementById('manual-editor');
  const outputEl = document.getElementById('positions-output');
  const titleEl = document.getElementById('example-title');
  const descriptionEl = document.getElementById('example-description');
  const automaticTarget = document.getElementById('automatic-diagram');
  const manualTarget = document.getElementById('manual-diagram');

  const state = {
    currentExample: null,
    manualLines: [],
    manualNodes: new Map(),
    manualText: '',
    positionTarget: null,
    positions: null,
    isInitializing: false,
    renderScheduled: false,
    layout: layoutOptions[0]?.value ?? 'dagre',
  };

  const parseManualPositions = () => {
    const manualNodes = new Map();
    const positions = {};
    state.manualLines.forEach((line, index) => {
      const match = manualNodePattern.exec(line);
      if (!match) {
        return;
      }
      const [, prefix, nodeId, coordsRaw, suffix] = match;
      manualNodes.set(nodeId, { lineIndex: index, prefix, suffix });
      const coords = parseCoordinateString(coordsRaw);
      if (coords) {
        positions[nodeId] = coords;
      }
    });
    state.manualNodes = manualNodes;
    return positions;
  };

  const getSnapshot = () => {
    const snapshot = {};
    for (const [nodeId, coords] of Object.entries(state.positionTarget ?? {})) {
      snapshot[nodeId] = { x: coords.x, y: coords.y };
    }
    return snapshot;
  };

  const getLayoutOption = (value) =>
    layoutOptions.find((option) => option.value === value) ?? layoutOptions[0];

  const updateLayoutUi = () => {
    const option = getLayoutOption(state.layout);
    if (layoutSelectEl && layoutSelectEl.value !== option.value) {
      layoutSelectEl.value = option.value;
    }
    if (layoutDescriptionEl) {
      layoutDescriptionEl.textContent = option?.description ?? '';
      layoutDescriptionEl.hidden = !option?.description;
    }
  };

  const applyLayoutDirective = (diagram) => {
    if (typeof diagram !== 'string') {
      return diagram;
    }
    const layout = state.layout;
    if (!layout || layout === 'dagre') {
      return diagram;
    }
    return `%%{init: { "layout": "${layout}" }}%%\n${diagram}`;
  };

  const updateDisplays = ({ syncEditor = true } = {}) => {
    if (editorEl && syncEditor && editorEl.value !== state.manualText) {
      const selectionStart = editorEl.selectionStart ?? state.manualText.length;
      const selectionEnd = editorEl.selectionEnd ?? state.manualText.length;
      editorEl.value = state.manualText;
      if (document.activeElement === editorEl && typeof editorEl.setSelectionRange === 'function') {
        const clampedStart = Math.min(selectionStart, state.manualText.length);
        const clampedEnd = Math.min(selectionEnd, state.manualText.length);
        editorEl.setSelectionRange(clampedStart, clampedEnd);
      }
    }
    if (outputEl) {
      const snapshot = getSnapshot();
      outputEl.textContent = Object.keys(snapshot).length
        ? JSON.stringify(snapshot, null, 2)
        : 'Drag nodes to populate manual coordinates.';
    }
  };

  const emitManualChange = (nodeId, pos) => {
    if (state.isInitializing || !state.currentExample) {
      return;
    }
    const snapshot = getSnapshot();
    console.log(
      `[${state.currentExample.title} • ${state.layout}] ${nodeId} → (${formatNumber(pos.x)}, ${formatNumber(pos.y)})`,
      snapshot
    );
    const detail = {
      exampleId: state.currentExample.id,
      nodeId,
      position: { ...pos },
      positions: snapshot,
      text: state.manualText,
      layout: state.layout,
    };
    document.dispatchEvent(new CustomEvent('mermaidmanualpositionchange', { detail }));
    if (typeof window.onManualPositionChange === 'function') {
      try {
        window.onManualPositionChange(detail);
      } catch (error) {
        console.error('onManualPositionChange handler error', error);
      }
    }
    updateDisplays();
  };

  const updateManualLine = (nodeId, pos) => {
    const info = state.manualNodes.get(nodeId);
    const formatted = formatPosition(pos);
    if (info) {
      state.manualLines[info.lineIndex] = info.prefix + formatted + info.suffix;
    } else {
      const prefix = `  ${nodeId}@{ position: `;
      const suffix = ' }';
      state.manualLines.push(prefix + formatted + suffix);
      state.manualNodes.set(nodeId, {
        lineIndex: state.manualLines.length - 1,
        prefix,
        suffix,
      });
    }
    state.manualText = state.manualLines.join('\n');
  };

  const createPositionsProxy = (initialPositions, options = {}) => {
    const { canonicalize = true, syncEditor = true } = options;
    const target = {};
    state.positionTarget = target;
    const proxy = new Proxy(target, {
      set(obj, prop, value) {
        const normalized = normalizePosition(value);
        if (!normalized) {
          return true;
        }
        const prev = obj[prop];
        if (prev && prev.x === normalized.x && prev.y === normalized.y) {
          return true;
        }
        obj[prop] = normalized;
        updateManualLine(prop, normalized);
        emitManualChange(prop, normalized);
        return true;
      },
      deleteProperty(obj, prop) {
        if (prop in obj) {
          delete obj[prop];
        }
        return true;
      },
    });
    state.positions = proxy;
    if (initialPositions && typeof initialPositions === 'object') {
      Object.entries(initialPositions).forEach(([key, value]) => {
        if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
          return;
        }
        const coords = canonicalize ? normalizePosition(value) : value;
        if (coords) {
          target[key] = coords;
          updateManualLine(key, coords);
        }
      });
    }
    if (syncEditor) {
      state.manualText = state.manualLines.join('\n');
    }
    updateDisplays({ syncEditor });
    return proxy;
  };

  const applyManualText = (text, options = {}) => {
    const lines = text.split(/\r?\n/);
    state.manualLines = lines;
    const parsed = parseManualPositions();
    createPositionsProxy(parsed, options);
  };

  const getManualStart = (nodeId, fallback) => {
    const source = state.positionTarget ?? {};
    const proxy = state.positions;
    const manual = source[nodeId] ?? proxy?.[nodeId];
    if (manual && Number.isFinite(manual.x) && Number.isFinite(manual.y)) {
      return { x: Number(manual.x), y: Number(manual.y) };
    }
    if (fallback && Number.isFinite(fallback.x) && Number.isFinite(fallback.y)) {
      return fallback;
    }
    return { x: 0, y: 0 };
  };

  const attachDragHandlers = () => {
    const svg = manualTarget.querySelector('svg');
    if (!svg) {
      return;
    }
    svg.style.touchAction = 'none';
    const nodes = [...svg.querySelectorAll('.nodes > g.node')];
    for (const nodeEl of nodes) {
      const nodeId = getNodeId(nodeEl);
      if (!nodeId) {
        continue;
      }
      nodeEl.style.cursor = 'grab';
      nodeEl.style.touchAction = 'none';

      const handlePointerDown = (event) => {
        event.preventDefault();
        const pointerId = event.pointerId;
        const startTransform = parseTransform(nodeEl.getAttribute('transform'));
        const start = getManualStart(nodeId, startTransform);
        let currentX = start.x;
        let currentY = start.y;
        const startPoint = pointerToSvgCoords(svg, event);

        const applyPoint = (point) => {
          const next = computeDragPosition(start, startPoint, point);
          if (!next) {
            return false;
          }
          currentX = next.x;
          currentY = next.y;
          nodeEl.setAttribute('transform', `translate(${currentX}, ${currentY})`);
          return true;
        };

        const commitPosition = () => {
          state.positions[nodeId] = { x: currentX, y: currentY };
        };

        nodeEl.setPointerCapture(pointerId);
        nodeEl.style.cursor = 'grabbing';

        const handlePointerMove = (moveEvent) => {
          if (moveEvent.pointerId !== pointerId) {
            return;
          }
          if (applyPoint(pointerToSvgCoords(svg, moveEvent))) {
            commitPosition();
          }
        };

        const handlePointerUp = (endEvent) => {
          if (endEvent.pointerId !== pointerId) {
            return;
          }
          svg.removeEventListener('pointermove', handlePointerMove);
          svg.removeEventListener('pointerup', handlePointerUp);
          svg.removeEventListener('pointercancel', handlePointerUp);
          nodeEl.releasePointerCapture(pointerId);
          nodeEl.style.cursor = 'grab';
          applyPoint(pointerToSvgCoords(svg, endEvent));
          commitPosition();
          scheduleManualRender();
        };

        svg.addEventListener('pointermove', handlePointerMove);
        svg.addEventListener('pointerup', handlePointerUp);
        svg.addEventListener('pointercancel', handlePointerUp);
      };

      nodeEl.addEventListener('pointerdown', handlePointerDown);
    }
  };

  const renderAutomaticDiagram = async (example) => {
    const active = state.currentExample;
    try {
      const code = applyLayoutDirective(example.before);
      const { svg } = await mermaid.render(`${example.id}-automatic`, code);
      if (active !== state.currentExample) {
        return;
      }
      automaticTarget.innerHTML = svg;
    } catch (error) {
      if (active === state.currentExample) {
        automaticTarget.innerHTML = '<p>Failed to render automatic diagram.</p>';
      }
      console.error('Failed to render automatic diagram', error);
    }
  };

  const renderManualDiagram = async (example) => {
    const active = state.currentExample;
    try {
      const code = applyLayoutDirective(state.manualText);
      const { svg } = await mermaid.render(`${example.id}-manual`, code);
      if (active !== state.currentExample) {
        return;
      }
      manualTarget.innerHTML = svg;
      attachDragHandlers();
    } catch (error) {
      if (active === state.currentExample) {
        manualTarget.innerHTML = '<p>Failed to render manual diagram.</p>';
      }
      console.error('Failed to render manual diagram', error);
    }
  };

  const scheduleManualRender = () => {
    if (state.renderScheduled || !state.currentExample) {
      return;
    }
    state.renderScheduled = true;
    requestAnimationFrame(() => {
      state.renderScheduled = false;
      void renderManualDiagram(state.currentExample);
    });
  };

  const loadExample = async (example) => {
    state.currentExample = example;
    if (titleEl) {
      titleEl.textContent = example.title;
    }
    if (descriptionEl) {
      descriptionEl.textContent = example.description;
    }
    state.renderScheduled = false;
    state.isInitializing = true;
    applyManualText(example.after, { canonicalize: true, syncEditor: true });
    state.isInitializing = false;
    await renderAutomaticDiagram(example);
    await renderManualDiagram(example);
  };

  if (layoutSelectEl) {
    layoutSelectEl.innerHTML = '';
    for (const option of layoutOptions) {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      layoutSelectEl.append(optionEl);
    }
  }

  updateLayoutUi();

  if (selectEl) {
    selectEl.innerHTML = '';
    for (const example of examples) {
      const option = document.createElement('option');
      option.value = example.id;
      option.textContent = example.title;
      selectEl.append(option);
    }
  }

  if (editorEl) {
    editorEl.addEventListener('input', () => {
      const text = editorEl.value;
      if (!state.currentExample) {
        state.manualText = text;
        updateDisplays({ syncEditor: false });
        return;
      }
      state.renderScheduled = false;
      applyManualText(text, { canonicalize: false, syncEditor: false });
      scheduleManualRender();
    });
  }

  if (layoutSelectEl) {
    layoutSelectEl.addEventListener('change', () => {
      const option = getLayoutOption(layoutSelectEl.value);
      if (option.value === state.layout) {
        updateLayoutUi();
        return;
      }
      state.layout = option.value;
      updateLayoutUi();
      state.renderScheduled = false;
      if (state.currentExample) {
        void (async () => {
          await renderAutomaticDiagram(state.currentExample);
          await renderManualDiagram(state.currentExample);
        })();
      }
    });
  }

  if (selectEl) {
    selectEl.addEventListener('change', () => {
      const example = examples.find((item) => item.id === selectEl.value);
      if (example) {
        void loadExample(example);
      }
    });
  }

  if (examples.length > 0 && selectEl) {
    selectEl.value = examples[0].id;
    await loadExample(examples[0]);
  }

  return {
    state,
    loadExample,
    setLayout(value) {
      const option = getLayoutOption(value);
      state.layout = option.value;
      updateLayoutUi();
      state.renderScheduled = false;
      if (state.currentExample) {
        return Promise.all([
          renderAutomaticDiagram(state.currentExample),
          renderManualDiagram(state.currentExample),
        ]);
      }
      return Promise.resolve();
    },
  };
};

export { EXAMPLES, LAYOUT_OPTIONS };

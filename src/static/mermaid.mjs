import mermaid from '../../node_modules/mermaid/dist/mermaid.esm.min.mjs';

function isUnknownDiagramError(code) {
  return code.includes('UnknownDiagramError');
}

function setBgColor(svgElement, bgColor) {
  document.body.style.backgroundColor = bgColor;
  svgElement.style.backgroundColor = bgColor;
}

function setSize(svgElement, size) {
  // Size has been explicitely set. Override absolute max-width with 100% for responsive SVG
  // This will be unset for raster image export
  svgElement.style.maxWidth = '100%';

  // Mermaid sets the width to 100% by default. Unset that since we're setting size explicitely
  svgElement.removeAttribute('width');

  size.width && svgElement.setAttribute('width', `${size.width}px`);
  size.height && svgElement.setAttribute('height', `${size.height}px`);
}

async function render(definition, config, bgColor, size) {
  // Wait for fonts to load to get accurate bounding box calculations
  await Promise.all(Array.from(document.fonts, (font) => font.load()));

  try {
    mermaid.initialize({
      ...config,
      startOnLoad: false,
      // `loose` is to enable "interaction" feature, for more details,
      // see https://mermaid.js.org/syntax/classDiagram.html#interaction
      securityLevel: 'loose',
    });

    const { container } = window;
    const { svg: svgHtml, bindFunctions } = await mermaid.render(
      'mermaid-svg',
      definition
    );

    container.innerHTML = svgHtml;
    bindFunctions?.(container);

    const svgElement = container.querySelector('svg');

    if (bgColor) {
      setBgColor(svgElement, bgColor);
    }

    if (size && (size.width || size.height)) {
      setSize(svgElement, size);
    }
  } catch (error) {
    console.error('Failed to render', error);
    if (isUnknownDiagramError(error.toString())) {
      throw new Error('Unknown diagram error');
    }
    throw error.message;
  }
}

window.App = {
  render,
};

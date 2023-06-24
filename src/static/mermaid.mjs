import mermaid from '../../node_modules/mermaid/dist/mermaid.esm.min.mjs';

function isSyntaxErrorFromMermaid(code) {
  return code.includes('Syntax error in graph') && code.includes('error-icon');
}

function injectFontAwesomeCss(svgElement) {
  const fontAeasomeCssUrl =
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  const style = document.createElement('style');

  style.innerText = `@import url("${fontAeasomeCssUrl}");`;
  svgElement.appendChild(style);
}

function injectXmlnsXlink(svgElement) {
  // Mermaid.js supports binding a click event to a node, it will compile a DOM
  // element with a `xlink:href` attribute. The `xmlns:xlink` parameter is essential
  // for the `xlink:href` parameter to not cause an error (for example: Namespace
  // prefix xlink for href on a is not defined).
  //
  // For more details, see:
  // 1. https://developer.mozilla.org/en-US/docs/Web/SVG/Namespaces_Crash_Course
  // 2. https://mermaid.js.org/syntax/classDiagram.html#interaction
  svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
}

async function render(definition, config) {
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

    const svg = container.querySelector('svg');
    injectXmlnsXlink(svg);
    injectFontAwesomeCss(svg);
  } catch (error) {
    console.error('Failed to render', error);
    if (isSyntaxErrorFromMermaid(error.toString())) {
      throw new Error('Syntax error in graph');
    }
    throw error;
  }
}

window.App = {
  render,
};

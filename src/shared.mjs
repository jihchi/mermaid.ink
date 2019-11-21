export function getOptionsFromCode(base64) {
  const theme = 'default';
	const str = Buffer.from(base64, 'base64').toString('utf8');
  let state;
  try {
    state = JSON.parse(str);
    if (state.code === undefined) {
      // not valid json
      state = { code: str, mermaid: { theme } };
    }
  } catch (e) {
    state = { code: str, mermaid: { theme } };
  }
  return state;
}

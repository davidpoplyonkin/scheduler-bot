const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

export async function resolveCssVar(varName: string) {
  await nextFrame(); // ensure that the value is re-calculated

  const value = (
    getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim()
  );

  return value;
}
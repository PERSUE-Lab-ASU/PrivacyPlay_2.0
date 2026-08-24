// Differential Privacy primitives.

/** Laplace sample with scale b. b = Delta / epsilon. */
export function laplace(b: number): number {
  // u in (-0.5, 0.5), avoid exact 0.5
  let u = Math.random() - 0.5;
  if (u === 0) u = 1e-9;
  return -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/** Laplace PDF for plotting. */
export function laplacePdf(x: number, mu: number, b: number): number {
  return (1 / (2 * b)) * Math.exp(-Math.abs(x - mu) / b);
}

export function noisyCount(trueCount: number, epsilon: number): number {
  const b = 1 / epsilon; // Delta = 1
  return trueCount + laplace(b);
}

export function noisySum(trueSum: number, range: number, epsilon: number): number {
  const b = range / epsilon; // Delta = R
  return trueSum + laplace(b);
}

/** Noisy mean = noisy sum / noisy count, with independent epsilon shares. */
export function noisyMean(
  trueSum: number,
  trueCount: number,
  range: number,
  epsSum: number,
  epsCount: number,
): { mean: number; ns: number; nc: number } {
  const ns = noisySum(trueSum, range, epsSum);
  const nc = noisyCount(trueCount, epsCount);
  const safe = Math.max(nc, 1e-6);
  return { mean: ns / safe, ns, nc };
}

/** Mean absolute deviation of Laplace(0, b) is b. */
export function meanAbsoluteNoise(b: number): number { return b; }

/**
 * Attacker success rate for the binary hidden person question, cutoff at the
 * midpoint. Laplace noise with scale 1/epsilon, worlds at 0 and 1.
 * success = 1 - 0.5 * exp(-epsilon / 2)
 */
export function attackSuccess(epsilon: number): number {
  return 1 - 0.5 * Math.exp(-epsilon / 2);
}

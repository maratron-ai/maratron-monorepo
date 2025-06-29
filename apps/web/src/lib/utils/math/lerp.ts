// @utils/math/lerp

// linear estimator, takes in start, end, and  and returns the interpolated value

// defined as
// start(t=start), end(t=end), t=[start/n,end/n] 

const lerp = (start: number, end: number, t: number): number =>
  start + (end - start) * t;

export default lerp;
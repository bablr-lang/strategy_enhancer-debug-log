/* global console */

import { printSource } from '@bablr/agast-helpers/tree';

export const enhanceStrategyWithDebugLogging = (strategy) => {
  return function* (...args) {
    const generator = strategy(...args);
    let current = generator.next();

    while (!current.done) {
      const instr = current.value;

      console.log(printSource(instr));

      const result = yield instr;

      current = generator.next(result);
    }

    return current.value;
  };
};

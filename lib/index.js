/* global console */

import { getCooked } from '@bablr/helpers/token';
import { printSource } from '@bablr/agast-helpers/tree';

export const enhanceStrategyWithDebugLogging = (strategy) => {
  return function* (...args) {
    const generator = strategy(...args);
    let current = generator.next();

    let anyResult = false;

    while (!current.done) {
      const instr = current.value;

      console.log(printSource(instr));

      const eats =
        instr.type === 'Call' && ['eat', 'eatMatch'].includes(getCooked(instr.properties.verb));

      const result = yield instr;

      anyResult = anyResult || (eats && result);

      current = generator.next(result);
    }

    return current.value;
  };
};

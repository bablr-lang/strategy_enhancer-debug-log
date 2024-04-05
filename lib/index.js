/* global console */

import { printSource } from '@bablr/agast-helpers/tree';
import { printTerminal } from '@bablr/agast-helpers/stream';
import { Coroutine } from '@bablr/coroutine';

function* wrapGeneratorWithEmitLogging(generator, indent) {
  const co = new Coroutine(generator);

  co.advance();

  while (!co.done) {
    const instr = co.value;

    if (instr.verb === 'emit') {
      console.log(indent + printTerminal(instr.arguments[0]));
    }

    co.advance(yield instr);
  }
}

function* wrapGeneratorWithLogging(generator, indent) {
  const co = new Coroutine(generator);

  co.advance();

  while (!co.done) {
    const instr = co.value;

    console.log(indent + printSource(instr));

    co.advance(yield instr);
  }
}

export const enhanceStrategyBuilderWithDebugLogging = (strategyBuilder, indent = '') => {
  return (...strategyBuilderArgs) => {
    const strategy = strategyBuilder(...strategyBuilderArgs);
    return (...args) => {
      return wrapGeneratorWithLogging(strategy(...args), indent);
    };
  };
};

export const enhanceStrategyBuilderWithEmittedLogging = (strategyBuilder, indent) => {
  return (...strategyBuilderArgs) => {
    const strategy = strategyBuilder(...strategyBuilderArgs);

    return (...args) => {
      return wrapGeneratorWithEmitLogging(strategy(...args), indent);
    };
  };
};

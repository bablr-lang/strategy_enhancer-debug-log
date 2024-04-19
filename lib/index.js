/* global console */

import { printSource } from '@bablr/agast-helpers/tree';
import { printTerminal } from '@bablr/agast-helpers/stream';
import { Coroutine } from '@bablr/coroutine';

function* wrapGeneratorWithEmitLogging(generator, indent, log) {
  const co = new Coroutine(generator);

  co.advance();

  while (!co.done) {
    const instr = co.value;

    if (instr.verb === 'emit') {
      log(indent + printTerminal(instr.arguments[0]));
    }

    co.advance(yield instr);
  }
}

function* wrapGeneratorWithLogging(generator, indent, log) {
  const co = new Coroutine(generator);

  co.advance();

  while (!co.done) {
    const instr = co.value;

    log(indent + printSource(instr));

    co.advance(yield instr);
  }
}

export const enhanceStrategyBuilderWithDebugLogging = (
  strategyBuilder,
  indent = '',
  log = console.log,
) => {
  return (...strategyBuilderArgs) => {
    const strategy = strategyBuilder(...strategyBuilderArgs);
    return (...args) => {
      return wrapGeneratorWithLogging(strategy(...args), indent, log);
    };
  };
};

export const enhanceStrategyBuilderWithEmittedLogging = (
  strategyBuilder,
  indent = '',
  log = console.log,
) => {
  return (...strategyBuilderArgs) => {
    const strategy = strategyBuilder(...strategyBuilderArgs);

    return (...args) => {
      return wrapGeneratorWithEmitLogging(strategy(...args), indent, log);
    };
  };
};

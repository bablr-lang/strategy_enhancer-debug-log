/* global console */

import { printSource } from '@bablr/agast-helpers/tree';
import { StreamGenerator, getStreamIterator, printTerminal } from '@bablr/agast-helpers/stream';
import { Coroutine } from '@bablr/coroutine';

function* wrapGeneratorWithEmitLogging(generator, indent, log) {
  const co = new Coroutine(generator);

  co.advance();

  for (;;) {
    if (co.current instanceof Promise) {
      co.current = yield co.current;
    }

    if (co.done) break;

    let instr = co.value;

    log(indent + printTerminal(instr));

    co.advance(yield instr);
  }
}

function* wrapGeneratorWithLogging(generator, indent, log) {
  const co = new Coroutine(generator);

  co.advance();

  for (;;) {
    if (co.current instanceof Promise) {
      co.current = yield co.current;
    }

    if (co.done) break;

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
      return new StreamGenerator(
        wrapGeneratorWithLogging(getStreamIterator(strategy(...args)), indent, log),
      );
    };
  };
};

export const enhanceStrategyBuilderWithEmittedLogging = (
  strategyBuilder,
  indent = '',
  log = console.log,
) => {
  return (...strategyBuilderArgs) => {
    const strategy = getStreamIterator(strategyBuilder(...strategyBuilderArgs));

    return new StreamGenerator(wrapGeneratorWithEmitLogging(strategy, indent, log));
  };
};

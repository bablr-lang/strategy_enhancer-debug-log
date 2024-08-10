/* global console */

import {
  StreamIterable,
  getStreamIterator,
  printTerminal,
  printCall,
} from '@bablr/agast-helpers/stream';
import {
  buildWriteEffect,
  buildCall,
  buildEmbeddedExpression,
} from '@bablr/agast-vm-helpers/internal-builders';
import { Coroutine } from '@bablr/coroutine';

function* wrapGeneratorWithEmitLogging(generator, indent) {
  const co = new Coroutine(generator);

  co.advance();

  for (;;) {
    if (co.current instanceof Promise) {
      co.current = yield co.current;
    }

    if (co.done) break;

    let terminal = co.value;

    if (terminal.type === 'Effect') {
      yield terminal;
      co.advance();
      continue;
    }

    yield buildWriteEffect(indent + printTerminal(terminal));

    co.advance(yield terminal);
  }

  return co.value;
}

const writeError = (text) => {
  return buildCall('write', text, buildEmbeddedExpression({ stream: 2 }));
};

function* wrapGeneratorWithLogging(generator, indent) {
  const co = new Coroutine(generator);

  co.advance();

  for (;;) {
    if (co.current instanceof Promise) {
      co.current = yield co.current;
    }

    if (co.done) break;

    const instr = co.value;

    if (instr.verb !== 'write') {
      yield writeError(indent + printCall(instr));
    }

    co.advance(yield instr);
  }

  return co.value;
}

export const enhanceStrategyBuilderWithDebugLogging = (
  strategyBuilder,
  indent = '',
  log = console.log,
) => {
  return (...strategyBuilderArgs) => {
    const strategy = strategyBuilder(...strategyBuilderArgs);
    return (...args) => {
      return new StreamIterable(
        wrapGeneratorWithLogging(getStreamIterator(strategy(...args)), indent, log),
      );
    };
  };
};

export const enhanceStrategyBuilderWithEmittedLogging = (strategyBuilder, indent = '') => {
  return (...strategyBuilderArgs) => {
    const strategy = getStreamIterator(strategyBuilder(...strategyBuilderArgs));

    return new StreamIterable(wrapGeneratorWithEmitLogging(strategy, indent));
  };
};

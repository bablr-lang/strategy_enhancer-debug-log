/* global console */

import { StreamIterable, getStreamIterator, printTag } from '@bablr/agast-helpers/stream';
import { buildWriteEffect, buildCall, buildEmbeddedObject } from '@bablr/agast-vm-helpers/builders';
import { printCall } from '@bablr/agast-vm-helpers/print';
import { Coroutine } from '@bablr/coroutine';

function* wrapGeneratorWithEmitLogging(generator, indent) {
  const co = new Coroutine(generator);

  co.advance();

  for (;;) {
    if (co.current instanceof Promise) {
      co.current = yield co.current;
    }

    if (co.done) break;

    let tag = co.value;

    if (tag.type === 'Effect') {
      yield tag;
      co.advance();
      continue;
    }

    yield buildWriteEffect(indent + printTag(tag));

    co.advance(yield tag);
  }

  return co.value;
}

const writeError = (text) => {
  return buildCall('write', text, buildEmbeddedObject({ stream: 2 }));
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

    return new StreamIterable(wrapGeneratorWithLogging(getStreamIterator(strategy), indent, log));
  };
};

export const enhanceStrategyBuilderWithEmittedLogging = (strategyBuilder, indent = '') => {
  return (...strategyBuilderArgs) => {
    const strategy = getStreamIterator(strategyBuilder(...strategyBuilderArgs));

    return new StreamIterable(wrapGeneratorWithEmitLogging(strategy, indent));
  };
};

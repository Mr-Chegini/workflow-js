/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IdentityOptions, Metadata, MethodOptions, NodeKey } from '../common';
import { getBPMNActivity, getBPMNProcess, parse, readFile } from '../utils';
import { Context, ContextStatus, State, Token, TokenStatus } from '../context';
import { BPMNDefinition, BPMNProcess } from '../type';
import { getActivity } from '../tools';
import { Container } from '../core';
import { Execute } from './types';

export interface ExecuteInterface {
  id?: string;
  factory?: () => any;
  handler?: any;
  context?: Context;
  data?: any;
  value?: any;
  identity?: IdentityOptions;
  xml?: string;
  path?: string;
  schema?: BPMNDefinition;
}

export class WorkflowJS {
  protected target!: any;

  protected context?: Context;
  protected process?: BPMNProcess;
  protected definition?: BPMNDefinition;

  private run(method: string, options: MethodOptions) {
    options.activity.token = options.token;
    options.activity.context = options.context;

    let value;
    let exception;

    try {
      options.token.status = TokenStatus.Running;
      options.context!.status = ContextStatus.Running;
      value = (this.target as any)[method](process, options);
      if (!options.token.isPaused()) options.token.status = TokenStatus.Completed;
    } catch (error) {
      options.context!.status = ContextStatus.Failed;
      options.token.status = TokenStatus.Failed;
      exception = error;
    }

    return { value, exception };
  }

  public execute<D = any>(options: ExecuteInterface): Execute<D> {
    const { handler, factory, path, xml, schema } = options;

    if (options.id) this.definition = Container.get(options.id);

    if (schema) this.definition = schema;
    else if (xml) this.definition = parse(xml)['bpmn:definitions'];
    else if (path) this.definition = parse(readFile(path))['bpmn:definitions'];

    if (!this.target)
      this.target = '$__metadata__' in this ? this : (factory ?? (() => undefined))() ?? handler;
    if (!this.target) throw new Error('Target workflow not found');

    const metadata = (this.target as any).$__metadata__ as Metadata;
    const nodes = Reflect.getMetadata(NodeKey, this.target, '$__metadata__');

    this.definition = this.definition ?? Container.get(metadata.definition.id);
    if (!this.definition) throw new Error('Definition schema not found');

    this.process = this.process ?? getBPMNProcess(this.definition, metadata.process);
    if (!this.process) throw new Error('Process definition not found');

    const { context, data, value } = options;
    this.context = context ?? Context.build({ data, status: ContextStatus.Ready });

    if (this.context.status === ContextStatus.Paused)
      throw new Error('Cannot execute workflow at paused state');

    let activity;
    if (options?.identity) {
      activity = getActivity(this.process, getBPMNActivity(this.process, options.identity));
    } else if (!this.context.tokens.length) {
      if (!this.process['bpmn:startEvent'] || this.process['bpmn:startEvent'].length !== 1)
        throw new Error('Start event is not defined in process or have more than one start event');

      activity = getActivity(this.process, {
        key: 'bpmn:startEvent',
        activity: this.process['bpmn:startEvent'][0],
      });
    }
    if (!activity) throw new Error('Node activity not found');

    let token;
    if (this.context.tokens.length == 0) {
      const state = State.build(activity.id, { name: activity.name, value });
      token = Token.build({ status: TokenStatus.Ready });
      token.push(state);

      this.context.addToken(token);
    } else {
      token = this.context.getTokens(activity.$)?.find((t) => t.status === TokenStatus.Ready);
    }

    if (!token) throw new Error('Token not found');

    let node!: { identity: IdentityOptions; propertyName: string };

    if (activity.name) node = nodes[activity.name];
    if (!node && activity.id) node = nodes[activity.id];
    if (!node) throw new Error('Requested node not found');

    const runOptions: { method: string; options: MethodOptions } = {
      method: node.propertyName,
      options: { token, data, value, activity, context: this.context },
    };

    do {
      const result = this.run(runOptions.method, runOptions.options);

      if (result.exception) {
        throw {
          result,
          target: this.target,
          context: this.context,
          process: this.process,
          definition: this.definition,
        };
      }

      if (this.context.status === ContextStatus.Running) {
        if (this.context.isCompleted()) this.context.status = ContextStatus.Completed;
        else if (this.context.isTerminated()) this.context.status = ContextStatus.Terminated;

        if (this.context.status === ContextStatus.Running) {
          const next = this.context.next();

          if (next) {
            next.value = result.value;
            if (next.name) runOptions.method = nodes[next.name]?.propertyName;
            if (!runOptions.method && next.ref) runOptions.method = nodes[next.ref]?.propertyName;

            if (!runOptions.method) throw new Error('Requested node not found at continuing stage');

            const token = this.context
              .getTokens({ id: next.ref })
              ?.find((t) => t.status === TokenStatus.Ready);

            if (!token) throw new Error('Token not found at continuing stage');

            const activity = getActivity(this.process, getBPMNActivity(this.process, { id: next.ref }));

            runOptions.options = { token, data, value: next.value, activity, context: this.context };
          }
        }
      }
    } while (this.context.status === ContextStatus.Running);

    if (this.context.isTerminated()) this.context.status = ContextStatus.Terminated;

    return {
      target: this.target,
      context: this.context,
      process: this.process,
      definition: this.definition,
    };
  }
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BPMNSchema,
  parse,
  readFile,
  getBPMNProcess,
  BPMNProcess,
  getActivity,
  getBPMNActivity,
} from '../../../src';
import { Activity } from '../../../src/core';

describe('test core base activity class', () => {
  let xml: string;
  let schema: BPMNSchema;
  let activity: Activity | undefined;

  let process: BPMNProcess | undefined;

  it('should return process', () => {
    xml = readFile('./example/supplying-pizza.bpmn');

    schema = parse(xml);
    process = getBPMNProcess(schema['bpmn:definitions'], { id: 'Process_166h0sl' });

    expect(process).toBeDefined();
  });

  it('should define activity object', () => {
    const activity = Activity.build(schema['bpmn:definitions'], process!);

    expect(activity.$).toEqual(schema['bpmn:definitions'].$);
    expect(activity.id).toBe(schema['bpmn:definitions'].$.id);
    expect(activity.name).toBe(schema['bpmn:definitions'].$.name);
  });

  it('should define activity object with incoming and outgoing', () => {
    const bpmnActivity = getBPMNActivity(process!, { id: 'Event_0yc597t' })?.activity;

    expect(bpmnActivity).toBeDefined();

    activity = getActivity(process!, { key: 'event', activity: bpmnActivity! as any });

    expect(activity).toBeDefined();

    expect(activity.incoming).toHaveLength(2);
    expect(activity.outgoing).toHaveLength(1);

    expect(activity.takeOutgoing()).toHaveLength(1);
  });

  it('should return boolean', () => {
    expect(activity!.isEnd()).toBeFalsy();
    expect(activity!.isStart()).toBeFalsy();
  });
});

import { BPMNProcess, BPMNTask } from '../../type';
import { Activity } from '../base';

export enum TaskType {
  Send = 'send',
  User = 'user',
  Manual = 'manual',
  Script = 'script',
  Receive = 'receive',
  Service = 'service',
  Business = 'business',
}

/* If the key property of the current object contains the word "send", return the value of the Send
enum, otherwise if the key property of the current object contains the word "user", return the value
of the User enum, otherwise if the key property of the current object contains the word "manual",
return the value of the Manual enum, otherwise if the key property of the current object contains
the word "script", return the value of the Script enum, otherwise if the key property of the current
object contains the word "receive", return the value of the Receive enum, otherwise if the key
property of the current object contains the word "service", return the value of the Service enum,
otherwise if the key property of the current object contains the word "business", return the value
of the Business enum, otherwise return undefined */
export class TaskActivity extends Activity {
  constructor(process: BPMNProcess, data?: Partial<TaskActivity>, key?: string) {
    super(process, data, key);
  }

  /**
   * If the key property of the current object contains the word "send", return the value of the Send
   * enum, otherwise if the key property of the current object contains the word "user", return the
   * value of the User enum, otherwise if the key property of the current object contains the word
   * "manual", return the value of the Manual enum, otherwise if the key property of the current object
   * contains the word "script", return the value of the Script enum, otherwise if the key property of
   * the current object contains the word "receive", return the value of the Receive enum, otherwise if
   * the key property of the current object contains the word "service", return the value of the
   * Service enum, otherwise if the key property of the current object contains the word "business",
   * return the value of the Business enum, otherwise return undefined
   *
   * @returns The task type.
   */
  get taskType() {
    if (this.key?.toLowerCase()?.includes('send')) return TaskType.Send;
    if (this.key?.toLowerCase()?.includes('user')) return TaskType.User;
    if (this.key?.toLowerCase()?.includes('manual')) return TaskType.Manual;
    if (this.key?.toLowerCase()?.includes('script')) return TaskType.Script;
    if (this.key?.toLowerCase()?.includes('receive')) return TaskType.Receive;
    if (this.key?.toLowerCase()?.includes('service')) return TaskType.Service;
    if (this.key?.toLowerCase()?.includes('business')) return TaskType.Business;
  }

  /**
   * A static method that is used to create a new instance of the TaskActivity class.
   *
   * @param {BPMNTask} el - BPMNTask - this is the BPMN element that is being built.
   * @param {BPMNProcess} process - The process that the activity belongs to.
   * @param {string} [key] - The key of the activity. This is used to identify the activity in the
   * process.
   *
   * @returns A new TaskActivity object.
   */
  static build(el: BPMNTask, process: BPMNProcess, key?: string) {
    return new TaskActivity(process, { ...el }, key);
  }
}

import { FlowProducer, QueueEvents } from 'bullmq';
import type { Job, QueueOptions } from 'bullmq'; // JobNode,

const defaultRedisConfiguration = {
  connection: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '6379'),
    username: process.env.USERNAME || 'default',
    password: process.env.PASSWORD || 'redispw',
    authpass: process.env.PASSWORD || 'redispw', // in case redis version is old
  },
};

const defaultJobOptions = {
  defaultJobOptions: {
    // Maximum amount of jobs to keep (not time!)
    removeOnComplete: 1000,
    // Maximum amount of jobs to keep (not time!)
    removeOnFail: 1000,
  },
};

class Parallelization {
  private queueName: string;
  private redisConfiguration: QueueOptions;
  private defaultJobOptions: QueueOptions;
  private queueEvents: QueueEvents;

  private flowProducer: FlowProducer;
  private jobMap: Map<string, Job<any, any, string>> = new Map();

  constructor({
    queueName = process.env.QUEUE_NAME || 'default-queue',
    redisConfiguration = defaultRedisConfiguration,
    jobOptions = defaultJobOptions,
  } = {}) {
    this.queueName = queueName;
    this.redisConfiguration = redisConfiguration;
    this.defaultJobOptions = jobOptions;
    this.queueEvents = new QueueEvents(this.queueName, this.redisConfiguration);
    this.flowProducer = new FlowProducer({
      ...this.redisConfiguration,
      ...this.defaultJobOptions,
    });
  }

  public getQueueName = (): string => {
    return this.queueName;
  };

  private returnValuePromise = (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const completedListener = (args: {
        jobId: string;
        returnvalue: string;
        prev?: string | undefined;
      }): void => {
        if (args.jobId === id) {
          console.log('# completed listeners: ', this.queueEvents.listenerCount('completed'));
          this.queueEvents.removeListener('completed', completedListener);
          this.queueEvents.removeListener('failed', failedListener);
          console.log(
            '(after) # completed listeners: ',
            this.queueEvents.listenerCount('completed')
          );
          resolve(args.returnvalue);
        }
      };
      const failedListener = (args: {
        jobId: string;
        failedReason: string;
        prev?: string | undefined;
      }): void => {
        if (args.jobId === id) {
          reject(`Job with ${id} failed`);
          console.log('# failed listeners: ', this.queueEvents.listenerCount('failed'));
          this.queueEvents.removeListener('completed', completedListener);
          this.queueEvents.removeListener('failed', failedListener);
          console.log('(after) # failed listeners: ', this.queueEvents.listenerCount('failed'));
        }
      };
      this.queueEvents.on('completed', completedListener);
      this.queueEvents.on('failed', failedListener);

      console.log('(adding) # failed listeners: ', this.queueEvents.listenerCount('failed'));
      console.log('(adding) # completed listeners: ', this.queueEvents.listenerCount('completed'));
    });
  };

  // TODO: add type to data -- not so straightforward.
  public addJob = async (identifier: string, data: any): Promise<any> => {
    await this.queueEvents.waitUntilReady();
    const job = this.jobMap.get(identifier);
    let chain;
    if (job == null) {
      chain = await this.flowProducer.add({
        name: identifier,
        data: data,
        queueName: this.queueName,
      });
      console.log("Job doesn't exist, creating a new one with id: ", chain.job.id);
      this.jobMap.set(identifier, chain.job);
    } else {
      // add the job as the parent of the last parent
      chain = await this.flowProducer.add({
        name: identifier,
        queueName: this.queueName,
        data: data,
        children: [job],
      });
      console.log('Job found: ', job.id, ' adding its child with id: ', chain.job.id);
    }
    if (chain.job.id == null) throw new Error('Job id is null. Not expected.');
    return await this.returnValuePromise(chain.job.id);
  };
}

export default Parallelization;

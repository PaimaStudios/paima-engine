import { FlowProducer, Queue } from 'bullmq';
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
    this.flowProducer = new FlowProducer({
      ...this.redisConfiguration,
      ...this.defaultJobOptions,
    });
  }

  public getQueueName = (): string => {
    return this.queueName;
  };

  // TODO: add type to data -- not so straightforward.
  public addJob = async (identifier: string, data: any): Promise<any> => {
    // Job<any, any, string>
    // const job = await this.findJob(identifier);
    const job = this.jobMap.get(identifier);
    if (job == null) {
      console.log("Job doesn't exist, creating a new one");
      const chain = await this.flowProducer.add({
        name: identifier,
        data: data,
        queueName: this.queueName,
      });
      // add chain.job to jobMap with identifier as key
      this.jobMap.set(identifier, chain.job);
      return chain.job.returnvalue;
    }
    console.log('Job found: ', job.id, ' adding its child');
    // add the job as the parent of the last parent
    const chain = await this.flowProducer.add({
      name: identifier,
      queueName: this.queueName,
      data: data,
      children: [job],
    });
    return chain.job.returnvalue;
  };
}

export default Parallelization;

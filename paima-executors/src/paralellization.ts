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

  private myQueue: Queue;
  private flowProducer: FlowProducer;

  constructor({
    queueName = process.env.QUEUE_NAME || 'default-queue',
    redisConfiguration = defaultRedisConfiguration,
    jobOptions = defaultJobOptions,
  } = {}) {
    this.queueName = queueName;
    this.redisConfiguration = redisConfiguration;
    this.defaultJobOptions = jobOptions;
    this.myQueue = new Queue(this.queueName, {
      ...this.redisConfiguration,
      ...this.defaultJobOptions,
    });
    this.flowProducer = new FlowProducer({
      ...this.redisConfiguration,
      ...this.defaultJobOptions,
    });
  }

  public getQueueName = (): string => {
    return this.queueName;
  };

  public findJob = async (identifier: string): Promise<Job<any, any, string> | null> => {
    // e.g., *83aomafiooao
    // find all jobs that start with the identifier and add the job as a child of the last child
    const jobs = await this.myQueue.getJobs(['waiting', 'active', 'delayed']); // 'completed', 'failed',
    const jobsWithId = jobs.filter(job => {
      if (job.id == null) return false;
      return job.id.startsWith(identifier);
    });

    // NicoList: Is this correct? maybe I actually may get multiple jobs.
    // If that's the case I need to change the logic here and get the parent of the parent and so on.
    if (jobsWithId.length > 1) {
      throw new Error(
        `Found multiple job trees: ${jobsWithId.length} for identifier ${identifier}`
      );
    }

    return jobsWithId.length === 0 ? null : jobsWithId[0];
  };

  // not the best but still pretty good
  // we can just check on a job id depending on the identifier and move to the next one only when it is done
  // * this idea is Plan B and it is not implemented yet *

  // TODO: add type to data -- not so straightforward.
  public addJob = async (identifier: string, data: any): Promise<Job<any, any, string>> => {
    const job = await this.findJob(identifier);
    if (job == null) {
      const chain = await this.flowProducer.add({
        name: identifier,
        data: data,
        queueName: this.queueName,
      });
      return chain.job;
    }
    // add the job as the parent of the last parent
    const chain = await this.flowProducer.add({
      name: identifier,
      queueName: this.queueName,
      data: data,
      children: [job],
    });
    return chain.job;
  };
}

export default Parallelization;

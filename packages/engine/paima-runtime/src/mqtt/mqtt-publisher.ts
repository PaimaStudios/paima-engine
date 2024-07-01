// import { ENV } from '@paima/utils';
import mqtt from 'mqtt';

const wait = async (n: number): Promise<void> =>
  await new Promise(resolve => setTimeout(resolve, n));

export enum MQTTSystemEvents {
  STF = '/sys/stf',
  BATCHER_HASH = '/sys/batch_hash',
}

/*
 * This class provides a MQTTPublisher Singleton.
 */
export class MQTTPublisher {
  private static client_: mqtt.MqttClient;
  private static listeners: Set<string> = new Set();

  private static getClient(): mqtt.MqttClient {
    if (MQTTPublisher.client_) return MQTTPublisher.client_;

    // Protocol MQTT
    MQTTPublisher.client_ = mqtt.connect('mqtt://127.0.0.1:1883'); // ENV.MQTT_BROKER_URL);

    // Print all messages.
    MQTTPublisher.client_.on('message', (topic, message) => {
      console.log('MQTT:', topic, message.toString());
    });
    return MQTTPublisher.client_;
  }

  public static async startListener(topic: MQTTSystemEvents): Promise<void> {
    if (MQTTPublisher.listeners.has(topic)) return;
    MQTTPublisher.getClient();

    let ready = false;
    MQTTPublisher.client_.on('connect', () => {
      MQTTPublisher.client_.subscribe(topic, e => {
        if (e) console.log('MQTT Client Error', e);
        ready = true;
      });
    });

    while (!ready) {
      console.log('Waiting for MQTT client at ', 'mqtt://127.0.0.1:1883'); // ENV.MQTT_BROKER_URL);
      await wait(100);
    }
    MQTTPublisher.listeners.add(topic);
    return;
  }

  public static sendMessage(message: Record<string, any>, topic: MQTTSystemEvents): void {
    const client = MQTTPublisher.getClient();
    client.publish(topic, JSON.stringify(message));
  }
}

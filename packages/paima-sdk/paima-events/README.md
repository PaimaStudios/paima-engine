# Paima Events: Publisher & Client

## Usage

### First create a Topic and define it's topic and behavior.
```typescript
class MyEvent extends PaimaEvent<{
  some_string: string;
  some_number: number;
}> {
  constructor() {
    super(
      'MyEvent',
      PaimaEventBrokerNames.PaimaEngine,
      `/game/my_event`,
      (event, message) => {
        console.log('Event: ', event);
        console.log('Message String: ', message.some_string);
        console.log('Message Number: ', message.some_number);
      }
    );
  }
}
```

### Listen to Messages
Create a listener and subscribe.
```typescript
const listener = new PaimaEventListener(ENV);
listener.subscribe(new MyEvent());
```

### Send Messages

Create a publisher and send messages
```typescript
const publisher = new PaimaEventPublisher(
                    new MyEvent(),
                    ENV
                  );

// Send a Message
publisher.sendMessage({
  some_string: 'hello world',
  some_number: 1000,
});
```



## Architecture

### Error handling

## Development

Install dependencies:

```
npm i
```

To test:

```
npm run test
```

Lint:

```
npm run lint
```

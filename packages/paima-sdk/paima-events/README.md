# Paima Events: Publisher & Client

## Usage

### First create a Topic and define it's topic and behavior.

```typescript
const MyEvent = {
  path: [TopicPrefix.Game, 'clear', { name: 'questId', type: Type.Integer() }],
  broker: PaimaEventBrokerNames.Batcher,
  type: Type.Object({
    playerId: Type.Integer(),
  }),
};
```

### Listen to Messages

Create a listener and subscribe.

```typescript
PaimaEventListener.Instance.subscribe(
  MyEvent,
  { questId: undefined }, // all quests
  ({ val, resolvedPath }) => {
    console.log(`Quest ${resolvedPath.questId} cleared by ${val.playerId}`);
  }
);
```

### Send Messages

Create a publisher and send messages

```typescript
PaimaEventListener.Instance.sendMessage(MyEvent, { questId: 5 }, { playerId: 10 });
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

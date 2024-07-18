# Paima Events: Publisher & Client

## Usage

### First create a Topic and define it's topic and behavior.

```typescript
const QuestCompletionEvent = genEvent({
  name: 'QuestCompletion',
  fields: [
    {
      name: 'questId',
      type: Type.Integer(),
      indexed: true,
    },
    {
      name: 'playerId',
      type: Type.Integer(),
    },
  ],
} as const);
```

### Listen to Messages

Create a listener and subscribe.

```typescript
PaimaEventManager.Instance.subscribe(
  {
    topic: QuestCompletionEvent,
    filter: { questId: undefined }, // all quests
  },
  event => {
    console.log(`Quest ${event.questId} cleared by ${event.playerId}`);
  }
);
```

### Send Messages

Create a publisher and send messages

```typescript
PaimaEventListener.Instance.sendMessage(QuestCompletionEvent, { questId: 5, playerId: 10 });
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

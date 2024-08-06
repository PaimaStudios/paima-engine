/* @name getEvents */
SELECT * FROM event WHERE
  COALESCE(data->>:field0 = :value0, 1=1) AND
  COALESCE(data->>:field1 = :value1, 1=1) AND
  COALESCE(data->>:field2 = :value2, 1=1) AND
  COALESCE(data->>:field3 = :value3, 1=1) AND
  COALESCE(data->>:field4 = :value4, 1=1) AND
  COALESCE(data->>:field5 = :value5, 1=1) AND
  COALESCE(data->>:field6 = :value6, 1=1) AND
  COALESCE(data->>:field7 = :value7, 1=1) AND
  COALESCE(data->>:field8 = :value8, 1=1) AND
  COALESCE(data->>:field9 = :value9, 1=1) AND
  COALESCE(block_height >= :from, 1=1) AND
  COALESCE(block_height <= :to, 1=1) AND
  COALESCE(address = :address, 1=1) AND
  topic = :topic!;

/* @name insertEvent */
INSERT INTO event (
  topic,
  address,
  data,
  block_height,
  tx,
  idx
) VALUES (
  :topic!,
  :address!,
  :data!,
  :block_height!,
  :tx!,
  :idx!
);

/* @name registerEventType */
INSERT INTO registered_event (
  name,
  topic
) VALUES (
  :name!,
  :topic!
);

/* @name getTopicsForEvent */
SELECT topic FROM registered_event WHERE name = :name!;

/* @name getTopics */
SELECT name, topic FROM registered_event;

/* @name getEventByTopic */
SELECT name FROM registered_event WHERE topic = :topic!;
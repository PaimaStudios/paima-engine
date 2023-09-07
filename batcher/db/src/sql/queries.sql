/* 
  @name insertUnvalidatedInput 
*/
INSERT INTO unvalidated_game_inputs(
  address_type,
  user_address,
  game_input,
  millisecond_timestamp,
  user_signature
) VALUES (
  :address_type!,
  :user_address!,
  :game_input!,
  :millisecond_timestamp!,
  :user_signature!
);

/* 
  @name insertValidatedInput 
*/
INSERT INTO validated_game_inputs(
  address_type,
  user_address,
  game_input,
  millisecond_timestamp,
  user_signature
) VALUES (
  :address_type!,
  :user_address!,
  :game_input!,
  :millisecond_timestamp!,
  :user_signature!
);

/* 
  @name getUnvalidatedInputs
*/
SELECT * FROM unvalidated_game_inputs;

/*
  @name validateInput
*/
WITH res AS (DELETE FROM unvalidated_game_inputs WHERE id = :id! RETURNING address_type, user_address, game_input, millisecond_timestamp, user_signature)
    INSERT INTO validated_game_inputs (address_type, user_address, game_input, millisecond_timestamp, user_signature) SELECT * FROM res;

/* 
  @name deleteUnvalidatedInput
*/
DELETE FROM unvalidated_game_inputs
WHERE id = :id!;

/* 
  @name insertStateValidating
*/

INSERT INTO input_states(
  input_hash,
  current_state,
  rejection_code
) VALUES (
  :input_hash!,
  'validating',
  0
);

/* 
  @name insertStateRejected
*/

INSERT INTO input_states(
  input_hash,
  current_state,
  rejection_code
) VALUES (
  :input_hash!,
  'rejected',
  :rejection_code!
);

/* 
  @name insertStateAccepted
*/

INSERT INTO input_states(
  input_hash,
  current_state,
  rejection_code
) VALUES (
  :input_hash!,
  'accepted',
  0
);

/* 
  @name updateStateAccepted
*/
UPDATE input_states
SET
    current_state = 'accepted'
WHERE input_hash = :input_hash!;

/* 
  @name updateStateRejected
*/
UPDATE input_states
SET
    current_state = 'rejected',
    rejection_code = :rejection_code!
WHERE input_hash = :input_hash!;

/* 
  @name updateStatePosted
*/
UPDATE input_states
SET
    current_state = 'posted',
    block_height = :block_height!,
    transaction_hash = :transaction_hash
WHERE input_hash = :input_hash!;

/*
  @name getInputState
*/

SELECT * FROM input_states
WHERE input_hash = :input_hash!;

/* 
  @name getValidatedInputs
*/
SELECT * FROM validated_game_inputs;

/* 
  @name deleteValidatedInput
*/
DELETE FROM validated_game_inputs
WHERE id = :id!;

/*
  @name getUserTrackingEntry
*/
SELECT * FROM user_tracking
WHERE user_address = :user_address!;

/*
  @name addUserTrackingEntry
*/
INSERT INTO user_tracking(
  user_address,
  latest_timestamp,
  inputs_minute,
  inputs_day,
  inputs_total
) VALUES (
  :user_address!,
  :current_timestamp!,
  1,
  1,
  1
);

/*
  @name incrementUserTrackingSameMinute
*/
UPDATE user_tracking
SET
    latest_timestamp = :current_timestamp!,
    inputs_minute = inputs_minute + 1,
    inputs_day = inputs_day + 1,
    inputs_total = inputs_total + 1
WHERE user_address = :user_address!;

/*
  @name incrementUserTrackingSameDay
*/
UPDATE user_tracking
SET
    latest_timestamp = :current_timestamp!,
    inputs_minute = 1,
    inputs_day = inputs_day + 1,
    inputs_total = inputs_total + 1
WHERE user_address = :user_address!;

/*
  @name incrementUserTrackingAnotherDay
*/
UPDATE user_tracking
SET
    latest_timestamp = :current_timestamp!,
    inputs_minute = 1,
    inputs_day = 1,
    inputs_total = inputs_total + 1
WHERE user_address = :user_address!;
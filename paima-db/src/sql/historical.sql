/* @name storeGameInput */
INSERT INTO historical_game_inputs(block_height, user_address, input_data)
VALUES (:block_height!, :user_address!, :input_data!);

/* @name getGameInput */
SELECT * FROM historical_game_inputs
WHERE block_height = :block_height!
AND user_address = :user_address!;
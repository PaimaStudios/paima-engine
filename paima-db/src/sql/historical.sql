/* @name storeGameInput */
INSERT INTO historical_game_inputs(block_height, user_address, input_data)
VALUES (:block_height!, :user_address!, :input_data!);
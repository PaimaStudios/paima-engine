/* @name getInputsTotal */
SELECT
    (SELECT COUNT(*) FROM historical_game_inputs) AS "game_inputs!",
    (SELECT COUNT(*) FROM scheduled_data) AS "scheduled_data!";

/* @name getInputsForBlock */
SELECT
    (
      SELECT COUNT(*)
      FROM historical_game_inputs
      WHERE block_height = :block_height!
    ) AS "game_inputs!",
    (
      SELECT COUNT(*)
      FROM scheduled_data
      WHERE block_height = :block_height!
    ) AS "scheduled_data!";

/* @name getInputsForAddress */
SELECT
    (
      SELECT COUNT(*)
      FROM historical_game_inputs
      WHERE
        user_address = :addr! AND
        block_height = :block_height!
    ) AS "game_inputs!",
    (
      SELECT COUNT(*)
      FROM scheduled_data
      LEFT JOIN scheduled_data_precompile ON scheduled_data.id = scheduled_data_precompile.id
      WHERE
        precompile = :addr! AND
        block_height = :block_height!
    ) AS "scheduled_data!";

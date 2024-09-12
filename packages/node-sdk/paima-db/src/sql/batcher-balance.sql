/* @name batcherBalanceByAddress */
SELECT balance FROM batcher_balance_data
WHERE batcher_address = :batcher_address!
AND user_address = :user_address!
;

/* @name batcherBalanceUpdate */
INSERT INTO batcher_balance_data
  (batcher_address, user_address, balance)
VALUES 
  (:batcher_address!, :user_address!, :balance!)
ON CONFLICT
  (batcher_address, user_address)
DO UPDATE SET 
  balance = batcher_balance_data.balance + EXCLUDED.balance
;
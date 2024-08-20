/* @name cdeBatcherPaymentByAddress */
SELECT balance FROM cde_batcher_payment_data
WHERE batcher_address = :batcher_address!
AND user_address = :user_address!
;

/* @name cdeBatcherPaymentUpdateBalance */
INSERT INTO cde_batcher_payment_data
  (batcher_address, user_address, balance)
VALUES 
  (:batcher_address!, :user_address!, :balance!)
ON CONFLICT
  (batcher_address, user_address)
DO UPDATE SET 
  balance = cde_batcher_payment_data.balance + EXCLUDED.balance
;
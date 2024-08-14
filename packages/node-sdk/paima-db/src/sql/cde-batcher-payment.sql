/* @name cdeBatcherPaymentByAddress */
SELECT balance FROM cde_batcher_payment_data
WHERE cde_name = :cde_name!
AND batcher_address = :batcher_address!
AND user_address = :user_address!
;

/* @name cdeBatcherPaymentUpdateBalance */
INSERT INTO cde_batcher_payment_data
  (cde_name, batcher_address, user_address, balance)
VALUES 
  (:cde_name!, :batcher_address!, :user_address!, :balance!)
ON CONFLICT
  (cde_name, batcher_address, user_address)
DO UPDATE SET 
  balance = cde_batcher_payment_data.balance + EXCLUDED.balance
;
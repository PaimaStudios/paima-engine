/* @name newAddress */
INSERT INTO addresses (address) 
VALUES (:address!); 

/* @name newAddressWithId */
INSERT INTO addresses (address, id) 
VALUES (:address!, :id!); 

/* @name newDelegation */
INSERT INTO delegations (from_id, set_id) 
VALUES (:from_id!, :set_id!);

/* @name getAddressFromId */
SELECT * FROM addresses
WHERE id = :id!;

/* @name getAddressFromAddress */
SELECT * FROM addresses
WHERE address = :address!;

/* @name getDelegation */
SELECT * FROM delegations
WHERE from_id = :from_id!
AND set_id = :set_id!;

/* @name getDelegationsFrom */
SELECT * FROM delegations
WHERE from_id = :from_id!;

/* @name getDelegationsTo */
SELECT * FROM delegations
WHERE set_id = :set_id!;

/* @name deleteDelegationsFrom */
DELETE FROM delegations
WHERE from_id = :from_id!;

/* @name deleteDelegationTo */
DELETE FROM delegations
WHERE set_id = :set_id!;

/* @name deleteAddress */
DELETE FROM addresses
WHERE address = :address!;

/* @name deleteAddressId */
DELETE FROM addresses
WHERE id = :id!;

/* @name updateAddress */
UPDATE addresses
SET address = :new_address!
WHERE address = :old_address!;

/* @name updateDelegateTo */
UPDATE delegations 
SET set_id = :new_to!
WHERE set_id = :old_to!;

/* @name updateDelegateFrom */
UPDATE delegations 
SET from_id = :new_from!
WHERE from_id = :old_from! 
AND set_id = :old_to!;

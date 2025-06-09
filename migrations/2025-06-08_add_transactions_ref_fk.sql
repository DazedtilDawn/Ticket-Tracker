-- Add self-referencing foreign key constraint to transactions.ref_id
ALTER TABLE transactions 
ADD CONSTRAINT transactions_ref_id_fkey 
FOREIGN KEY (ref_id) REFERENCES transactions(id) ON DELETE CASCADE;
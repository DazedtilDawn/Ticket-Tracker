-- Add self-referencing foreign key constraint to transactions.ref_id
-- This constraint ensures that ref_id (when not null) must reference a valid transaction.id
-- Used for undo operations where ref_id points to the original transaction being undone

ALTER TABLE "transactions" 
  ADD CONSTRAINT "transactions_ref_id_transactions_id_fk" 
  FOREIGN KEY ("ref_id") REFERENCES "transactions"("id") 
  ON DELETE CASCADE 
  ON UPDATE NO ACTION;
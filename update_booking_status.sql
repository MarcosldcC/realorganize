-- Atualizar status das reservas para os novos valores do enum
UPDATE bookings SET status = 'CONFIRMED' WHERE status = 'HOLD';
UPDATE bookings SET status = 'COMPLETED' WHERE status = 'RETURNED';

-- Atualizar totalPrice para totalValue
ALTER TABLE bookings RENAME COLUMN "totalPrice" TO "totalValue";

-- Adicionar eventTitle se não existir
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "eventTitle" TEXT DEFAULT 'Evento';

-- Remover colunas que não existem mais no schema
ALTER TABLE bookings DROP COLUMN IF EXISTS "eventAddress";
ALTER TABLE bookings DROP COLUMN IF EXISTS "paymentStatus";
ALTER TABLE bookings DROP COLUMN IF EXISTS "userId";

-- Atualizar company_settings
ALTER TABLE company_settings DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE company_settings DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE company_settings DROP COLUMN IF EXISTS "document";

-- Atualizar users
ALTER TABLE users DROP COLUMN IF EXISTS "role";

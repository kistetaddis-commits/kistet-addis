-- Migration: Align events table columns with user requirements
-- Timestamp: 20240524000001

ALTER TABLE public.events 
RENAME COLUMN "date" TO event_date;

ALTER TABLE public.events 
RENAME COLUMN "price" TO ticket_price;

-- Add check constraints for validation
ALTER TABLE public.events
ADD CONSTRAINT event_date_future CHECK (event_date > now()),
ADD CONSTRAINT total_tickets_positive CHECK (total_tickets > 0),
ADD CONSTRAINT ticket_price_non_negative CHECK (ticket_price >= 0);
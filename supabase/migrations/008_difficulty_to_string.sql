-- Change difficulty column from integer to text
ALTER TABLE games ALTER COLUMN difficulty TYPE TEXT USING difficulty::TEXT;

-- Update any existing integer values to the new string equivalents to maintain historical data
UPDATE games SET difficulty = 'Initiate' WHERE difficulty = '4';
UPDATE games SET difficulty = 'Relentless' WHERE difficulty = '7';
UPDATE games SET difficulty = 'Executioner' WHERE difficulty = '10';

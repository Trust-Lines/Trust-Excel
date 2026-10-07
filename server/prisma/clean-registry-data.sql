-- Clean existing registry data (remove scope violations)
-- Keep tables but remove all seeded data

DELETE FROM role_table_access;
DELETE FROM role_page_access;
DELETE FROM action_registry;
DELETE FROM column_registry;
DELETE FROM table_registry;
DELETE FROM page_registry;
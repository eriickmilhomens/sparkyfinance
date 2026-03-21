-- Delete the auth user
DELETE FROM auth.users WHERE id = '4726869b-49f7-472c-b26f-72695fd7b95f';
-- Also delete any other leftover users
DELETE FROM auth.users WHERE id = '62a726fc-4e8a-41be-bddb-41cb8f5abed8';
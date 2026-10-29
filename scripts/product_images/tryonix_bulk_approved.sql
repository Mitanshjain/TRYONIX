USE tryonix_db;
START TRANSACTION;
COMMIT;
SELECT COUNT(*) total, SUM(image_url IS NULL) missing FROM products;

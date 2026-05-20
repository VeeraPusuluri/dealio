-- Sample Seed Data
-- Users
INSERT INTO "User" ("phone", "fullName", "email", "role") VALUES 
('9876543210', 'John Builder', 'john@builder.com', 'BUILDER'),
('9876543211', 'Alice Customer', 'alice@customer.com', 'CUSTOMER');

-- Builders
INSERT INTO "Builder" ("userId") VALUES (1);

-- Projects
INSERT INTO "Project" ("builderId", "name", "city", "description", "address", "totalUnits", "reraNumber", "priceFrom", "priceTo", "status") VALUES 
(1, 'Skyline Residency', 'Hyderabad', 'Luxury apartments in the heart of the city', 'Gachibowli, Hyderabad', 150, 'P02400001234', 7500000, 15000000, 'ACTIVE'),
(1, 'Green Valley', 'Bengaluru', 'Eco-friendly villas', 'Whitefield, Bengaluru', 50, 'PRM/KA/RERA/1234', 20000000, 45000000, 'ACTIVE');

-- Meetings
INSERT INTO "Meeting" ("projectId", "customerId", "builderId", "customerPhone", "customerName", "preferredDate", "preferredTime", "status") VALUES 
(1, 2, 1, '9876543211', 'Alice Customer', '2024-06-01', '10:00 AM', 'Pending');

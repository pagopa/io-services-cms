REVOKE SELECT, INSERT, UPDATE, DELETE ON "${schemaName}".service_review TO "${appUser}";

DROP TABLE IF EXISTS "${schemaName}".service_review;

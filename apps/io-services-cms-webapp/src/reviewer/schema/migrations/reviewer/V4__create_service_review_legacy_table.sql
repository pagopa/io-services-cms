CREATE TABLE IF NOT EXISTS "${schemaName}".service_review_legacy (
	"service_id" varchar NOT NULL, -- 'the unique identifier for the Service'
	"service_version" varchar NOT NULL, -- 'the version of the Service'
	"ticket_id" varchar NULL, -- 'the unique identifier for the Ticket'
	"ticket_key" varchar NULL, -- 'the key identifier for the Ticket'
	"status" varchar NOT NULL, -- 'the ServiceReviewLegacy status'
	"extra_data" json NULL, -- 'all other ServiceReviewLegacy data'
	CONSTRAINT service_review_legacy_pk PRIMARY KEY (service_id,service_version)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON "${schemaName}".service_review_legacy TO "${appUser}";
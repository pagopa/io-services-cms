CREATE TABLE IF NOT EXISTS reviewer.service_review (
	"service_id" varchar NOT NULL, -- 'the unique identifier for the Service'
	"service_version" varchar NOT NULL, -- 'the version of the Service'
	"ticket_id" varchar NULL, -- 'the unique identifier for the Ticket'
	"ticket_key" varchar NULL, -- 'the key identifier for the Ticket'
	"status" varchar NOT NULL, -- 'the ServiceReview status'
	"extra_data" json NULL, -- 'all other ServiceReview data'
	CONSTRAINT service_review_pk PRIMARY KEY (service_id,service_version)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON reviewer.service_review TO "${appUser}";

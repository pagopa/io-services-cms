CREATE TABLE IF NOT EXISTS taxonomy.topic (
	"id" smallint NOT NULL GENERATED BY DEFAULT AS IDENTITY (sequence name topic_id_seq minvalue 0), -- 'the unique identifier for the Topic'
	"name" varchar NOT NULL, -- 'the name of the Topic'
	"deleted" boolean NOT NULL DEFAULT false, -- 'the logical deletion of the Topic'
	CONSTRAINT topic_pk PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON taxonomy.topic TO "${appUser}";
GRANT USAGE ON SCHEMA reviewer TO "${readonlyUser}";

GRANT SELECT ON reviewer.service_review TO "${readonlyUser}";
GRANT SELECT ON reviewer.service_review_legacy TO "${readonlyUser}";
GRANT SELECT ON taxonomy.topic TO "${readonlyUser}";

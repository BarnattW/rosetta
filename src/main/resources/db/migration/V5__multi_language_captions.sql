-- Multi-language support: replace single target_language with a join table,
-- and tag each caption row with the language it belongs to.

CREATE TABLE job_target_languages (
    job_id   UUID         NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    language VARCHAR(50)  NOT NULL
);

INSERT INTO job_target_languages (job_id, language)
SELECT id, target_language FROM jobs WHERE target_language IS NOT NULL;

ALTER TABLE jobs DROP COLUMN target_language;

ALTER TABLE captions ADD COLUMN language VARCHAR(50);

UPDATE captions c
SET    language = (
    SELECT jtl.language
    FROM   job_target_languages jtl
    WHERE  jtl.job_id = c.job_id
    LIMIT  1
);

UPDATE captions SET language = 'en' WHERE language IS NULL;

ALTER TABLE captions ALTER COLUMN language SET NOT NULL;

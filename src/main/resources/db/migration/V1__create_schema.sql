CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    token_balance INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE job_status AS ENUM ('PENDING','TRANSCRIBING','TRANSLATING','CAPTIONING','COMPLETED','FAILED');

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    status job_status NOT NULL DEFAULT 'PENDING',
    source_language VARCHAR(10),
    target_language VARCHAR(10),
    video_storage_key VARCHAR(500),
    tokens_used INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);


CREATE TABLE captions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    index INTEGER NOT NULL,
    start_time BIGINT NOT NULL,
    end_time BIGINT NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    edited_text TEXT
);

CREATE TYPE transaction_type AS ENUM ('PURCHASE','DEDUCTION');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    stripe_payment_id VARCHAR(255),
    job_id UUID REFERENCES jobs(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
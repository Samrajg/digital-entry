-- BUG-08 FIX: Tables reordered so foreign-key dependencies are always satisfied.
-- Correct creation order:
--   1. users, campuses, security, dynamic_forms  (no FK dependencies)
--   2. gates                                     (depends on campuses)
--   3. qr_codes, scheduled_visits               (depends on gates, campuses, dynamic_forms)
--   4. visitors, vehicles                        (depends on qr_codes, gates, campuses, security, dynamic_forms)
--   5. appointments                              (depends on users, campuses, gates, security, visitors)

-- ─── Tier 1: No FK dependencies ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
	user_id INTEGER NOT NULL,
	username VARCHAR NOT NULL,
	user_pin VARCHAR NOT NULL,
	user_role VARCHAR NOT NULL,
	created_at DATETIME NOT NULL,
	PRIMARY KEY (user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);

CREATE TABLE IF NOT EXISTS campuses (
	campus_id INTEGER NOT NULL,
	name VARCHAR(255) NOT NULL,
	code VARCHAR(50) NOT NULL,
	address VARCHAR(255),
	city VARCHAR(100),
	is_active BOOLEAN NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (campus_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_campuses_code ON campuses (code);

CREATE TABLE IF NOT EXISTS security (
	security_id INTEGER NOT NULL,
	security_name VARCHAR(255) NOT NULL,
	security_pin VARCHAR(255) NOT NULL,
	is_active BOOLEAN NOT NULL,
	created_at DATETIME NOT NULL,
	PRIMARY KEY (security_id)
);

CREATE TABLE IF NOT EXISTS dynamic_forms (
	form_id VARCHAR(100) NOT NULL,
	name VARCHAR(255) NOT NULL,
	description VARCHAR(500),
	schema JSON DEFAULT '[]' NOT NULL,
	is_active BOOLEAN NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (form_id)
);

-- ─── Tier 2: Depends on Tier 1 ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gates (
	gate_id INTEGER NOT NULL,
	campus_id INTEGER NOT NULL,
	name VARCHAR(255) NOT NULL,
	code VARCHAR(50) NOT NULL,
	description VARCHAR(500),
	location VARCHAR(255),
	is_active BOOLEAN NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (gate_id),
	FOREIGN KEY(campus_id) REFERENCES campuses (campus_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_gates_code ON gates (code);
CREATE INDEX IF NOT EXISTS ix_gates_campus_id ON gates (campus_id);

-- ─── Tier 3: Depends on Tier 2 ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS qr_codes (
	qr_code_id VARCHAR(100) NOT NULL,
	gate_id INTEGER NOT NULL,
	code VARCHAR(100) NOT NULL,
	name VARCHAR(255) NOT NULL,
	qr_type VARCHAR(50) NOT NULL,
	destination_url VARCHAR(500) NOT NULL,
	form_id VARCHAR(100),
	is_active BOOLEAN NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (qr_code_id),
	FOREIGN KEY(gate_id) REFERENCES gates (gate_id) ON DELETE CASCADE,
	FOREIGN KEY(form_id) REFERENCES dynamic_forms (form_id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_qr_codes_code ON qr_codes (code);
CREATE INDEX IF NOT EXISTS ix_qr_codes_gate_id ON qr_codes (gate_id);

CREATE TABLE IF NOT EXISTS scheduled_visits (
	scheduled_visit_id INTEGER NOT NULL,
	visitor_name VARCHAR(255) NOT NULL,
	purpose VARCHAR(255),
	expected_date DATE NOT NULL,
	time_slot VARCHAR(50),
	campus_id INTEGER,
	gate_id INTEGER,
	qr_pass_value VARCHAR(100) NOT NULL,
	status VARCHAR(50),
	created_at DATETIME NOT NULL,
	PRIMARY KEY (scheduled_visit_id),
	FOREIGN KEY(campus_id) REFERENCES campuses (campus_id) ON DELETE CASCADE,
	FOREIGN KEY(gate_id) REFERENCES gates (gate_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_scheduled_visits_qr_pass_value ON scheduled_visits (qr_pass_value);
CREATE INDEX IF NOT EXISTS ix_scheduled_visits_expected_date ON scheduled_visits (expected_date);

-- ─── Tier 4: Depends on Tiers 1–3 ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS visitors (
	visitor_id INTEGER NOT NULL,
	form_id VARCHAR(100) NOT NULL,
	qr_code_id VARCHAR(100) NOT NULL,
	gate_id INTEGER NOT NULL,
	campus_id INTEGER NOT NULL,
	appointment_id INTEGER,
	security_id INTEGER,
	checkout_security_id INTEGER,
	form_data JSON NOT NULL,
	created_at DATETIME NOT NULL,
	checked_out_at DATETIME,
	PRIMARY KEY (visitor_id),
	FOREIGN KEY(form_id) REFERENCES dynamic_forms (form_id) ON DELETE CASCADE,
	FOREIGN KEY(qr_code_id) REFERENCES qr_codes (qr_code_id) ON DELETE CASCADE,
	FOREIGN KEY(gate_id) REFERENCES gates (gate_id) ON DELETE CASCADE,
	FOREIGN KEY(campus_id) REFERENCES campuses (campus_id) ON DELETE CASCADE,
	FOREIGN KEY(security_id) REFERENCES security (security_id) ON DELETE SET NULL,
	FOREIGN KEY(checkout_security_id) REFERENCES security (security_id) ON DELETE SET NULL
	-- NOTE: appointment_id FK added in Tier 5 via ALTER TABLE (appointments table created after visitors)
);
CREATE INDEX IF NOT EXISTS ix_visitors_form_id ON visitors (form_id);
CREATE INDEX IF NOT EXISTS ix_visitors_qr_code_id ON visitors (qr_code_id);
CREATE INDEX IF NOT EXISTS ix_visitors_gate_id ON visitors (gate_id);
CREATE INDEX IF NOT EXISTS ix_visitors_appointment_id ON visitors (appointment_id);
CREATE INDEX IF NOT EXISTS ix_visitors_security_id ON visitors (security_id);

-- BUG-07 FIX: Added missing campus_id column to vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
	vehicle_id INTEGER NOT NULL,
	form_id VARCHAR(100) NOT NULL,
	qr_code_id VARCHAR(100) NOT NULL,
	gate_id INTEGER NOT NULL,
	campus_id INTEGER NOT NULL,
	security_id INTEGER,
	checkout_security_id INTEGER,
	form_data JSON NOT NULL,
	created_at DATETIME NOT NULL,
	checked_out_at DATETIME,
	PRIMARY KEY (vehicle_id),
	FOREIGN KEY(form_id) REFERENCES dynamic_forms (form_id) ON DELETE CASCADE,
	FOREIGN KEY(qr_code_id) REFERENCES qr_codes (qr_code_id) ON DELETE CASCADE,
	FOREIGN KEY(gate_id) REFERENCES gates (gate_id) ON DELETE CASCADE,
	FOREIGN KEY(campus_id) REFERENCES campuses (campus_id) ON DELETE CASCADE,
	FOREIGN KEY(security_id) REFERENCES security (security_id) ON DELETE SET NULL,
	FOREIGN KEY(checkout_security_id) REFERENCES security (security_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ix_vehicles_form_id ON vehicles (form_id);
CREATE INDEX IF NOT EXISTS ix_vehicles_qr_code_id ON vehicles (qr_code_id);
CREATE INDEX IF NOT EXISTS ix_vehicles_gate_id ON vehicles (gate_id);
CREATE INDEX IF NOT EXISTS ix_vehicles_security_id ON vehicles (security_id);

-- ─── Tier 5: Depends on all of the above ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
	appointment_id INTEGER NOT NULL,
	appointment_code VARCHAR(100) NOT NULL,
	created_by INTEGER NOT NULL,
	employee_name VARCHAR(255) NOT NULL,
	department VARCHAR(255),
	visitor_name VARCHAR(255) NOT NULL,
	visitor_email VARCHAR(255),
	visitor_phone VARCHAR(50),
	visitor_count INTEGER,
	purpose VARCHAR(500) NOT NULL,
	campus_id INTEGER NOT NULL,
	meeting_location VARCHAR(500) NOT NULL,
	appointment_date DATE NOT NULL,
	time_slot_start VARCHAR(10) NOT NULL,
	time_slot_end VARCHAR(10) NOT NULL,
	status VARCHAR(50),
	notes VARCHAR(500),
	checked_in_at DATETIME,
	checked_in_gate_id INTEGER,
	checked_in_security_id INTEGER,
	visitor_record_id INTEGER,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (appointment_id),
	FOREIGN KEY(created_by) REFERENCES users (user_id) ON DELETE CASCADE,
	FOREIGN KEY(campus_id) REFERENCES campuses (campus_id) ON DELETE CASCADE,
	FOREIGN KEY(checked_in_gate_id) REFERENCES gates (gate_id) ON DELETE SET NULL,
	FOREIGN KEY(checked_in_security_id) REFERENCES security (security_id) ON DELETE SET NULL,
	FOREIGN KEY(visitor_record_id) REFERENCES visitors (visitor_id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_appointments_appointment_code ON appointments (appointment_code);
CREATE INDEX IF NOT EXISTS ix_appointments_appointment_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS ix_appointments_status ON appointments (status);

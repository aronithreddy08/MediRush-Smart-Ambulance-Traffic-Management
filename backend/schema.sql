BEGIN TRANSACTION;
CREATE TABLE ambulances (
	ambulance_id VARCHAR NOT NULL, 
	driver_name VARCHAR NOT NULL, 
	vehicle_number VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	current_lat FLOAT NOT NULL, 
	current_lng FLOAT NOT NULL, 
	current_speed FLOAT, 
	heading FLOAT, 
	priority_level VARCHAR, 
	active_trip_id VARCHAR, 
	last_ping DATETIME, 
	PRIMARY KEY (ambulance_id)
);
CREATE TABLE emergency_trips (
	trip_id VARCHAR NOT NULL, 
	ambulance_id VARCHAR NOT NULL, 
	hospital_id VARCHAR, 
	patient_condition VARCHAR, 
	severity VARCHAR, 
	status VARCHAR, 
	origin_lat FLOAT NOT NULL, 
	origin_lng FLOAT NOT NULL, 
	dest_lat FLOAT, 
	dest_lng FLOAT, 
	start_time DATETIME, 
	end_time DATETIME, 
	baseline_estimated_time_min FLOAT, 
	final_actual_time_min FLOAT, 
	reroute_count INTEGER, 
	PRIMARY KEY (trip_id)
);
CREATE TABLE hospitals (
	hospital_id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	address VARCHAR, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	emergency_capability BOOLEAN, 
	specializations VARCHAR, 
	total_icu_beds INTEGER, 
	available_icu_beds INTEGER, 
	contact_phone VARCHAR, 
	readiness_score FLOAT, 
	PRIMARY KEY (hospital_id)
);
CREATE TABLE road_segments (
	road_id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	start_node_id VARCHAR NOT NULL, 
	end_node_id VARCHAR NOT NULL, 
	start_lat FLOAT NOT NULL, 
	start_lng FLOAT NOT NULL, 
	end_lat FLOAT NOT NULL, 
	end_lng FLOAT NOT NULL, 
	length_km FLOAT NOT NULL, 
	speed_limit_kmh FLOAT, 
	road_type VARCHAR, 
	lanes INTEGER, 
	PRIMARY KEY (road_id)
);
CREATE TABLE signal_preemption_events (
	event_id VARCHAR NOT NULL, 
	signal_id VARCHAR NOT NULL, 
	trip_id VARCHAR, 
	ambulance_id VARCHAR NOT NULL, 
	requested_at DATETIME, 
	green_granted_at DATETIME, 
	cleared_at DATETIME, 
	status VARCHAR, 
	PRIMARY KEY (event_id), 
	FOREIGN KEY(signal_id) REFERENCES traffic_signals (signal_id)
);
CREATE TABLE traffic_data_records (
	record_id VARCHAR NOT NULL, 
	road_id VARCHAR NOT NULL, 
	timestamp DATETIME, 
	current_speed_kmh FLOAT NOT NULL, 
	vehicle_density INTEGER, 
	congestion_level FLOAT, 
	weather VARCHAR, 
	PRIMARY KEY (record_id)
);
CREATE TABLE traffic_signals (
	signal_id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	current_state VARCHAR, 
	cycle_duration_sec INTEGER, 
	time_in_cycle_sec INTEGER, 
	is_preempted BOOLEAN, 
	preemption_ambulance_id VARCHAR, 
	normal_green_direction VARCHAR, 
	hardware_ip VARCHAR, 
	PRIMARY KEY (signal_id)
);
CREATE TABLE trip_analytics (
	analytics_id VARCHAR NOT NULL, 
	trip_id VARCHAR NOT NULL, 
	total_distance_km FLOAT NOT NULL, 
	baseline_duration_min FLOAT NOT NULL, 
	medirush_duration_min FLOAT NOT NULL, 
	time_saved_min FLOAT NOT NULL, 
	percentage_time_saved FLOAT NOT NULL, 
	signals_prioritized_count INTEGER, 
	reroute_count INTEGER, 
	avg_speed_kmh FLOAT, 
	ai_prediction_accuracy_pct FLOAT, 
	created_at DATETIME, 
	PRIMARY KEY (analytics_id), 
	UNIQUE (trip_id), 
	FOREIGN KEY(trip_id) REFERENCES emergency_trips (trip_id)
);
CREATE TABLE trip_routes (
	route_id VARCHAR NOT NULL, 
	trip_id VARCHAR NOT NULL, 
	route_type VARCHAR, 
	geometry_json TEXT NOT NULL, 
	distance_km FLOAT NOT NULL, 
	estimated_time_min FLOAT NOT NULL, 
	traffic_score FLOAT, 
	is_selected BOOLEAN, 
	calculated_at DATETIME, 
	PRIMARY KEY (route_id), 
	FOREIGN KEY(trip_id) REFERENCES emergency_trips (trip_id)
);
CREATE TABLE trip_telemetry_logs (
	log_id VARCHAR NOT NULL, 
	trip_id VARCHAR NOT NULL, 
	timestamp DATETIME, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	speed_kmh FLOAT, 
	bearing FLOAT, 
	distance_remaining_km FLOAT, 
	eta_seconds FLOAT, 
	PRIMARY KEY (log_id), 
	FOREIGN KEY(trip_id) REFERENCES emergency_trips (trip_id)
);
CREATE TABLE users (
	id VARCHAR NOT NULL, 
	username VARCHAR NOT NULL, 
	password_hash VARCHAR NOT NULL, 
	full_name VARCHAR NOT NULL, 
	role VARCHAR NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE INDEX ix_ambulances_ambulance_id ON ambulances (ambulance_id);
CREATE INDEX ix_hospitals_hospital_id ON hospitals (hospital_id);
CREATE INDEX ix_emergency_trips_ambulance_id ON emergency_trips (ambulance_id);
CREATE INDEX ix_traffic_signals_signal_id ON traffic_signals (signal_id);
CREATE INDEX ix_road_segments_road_id ON road_segments (road_id);
CREATE INDEX ix_traffic_data_records_road_id ON traffic_data_records (road_id);
CREATE INDEX ix_traffic_data_records_timestamp ON traffic_data_records (timestamp);
CREATE INDEX ix_trip_routes_trip_id ON trip_routes (trip_id);
CREATE INDEX ix_trip_telemetry_logs_trip_id ON trip_telemetry_logs (trip_id);
CREATE INDEX ix_signal_preemption_events_signal_id ON signal_preemption_events (signal_id);
COMMIT;

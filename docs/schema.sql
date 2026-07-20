-- UniNest — PostgreSQL schema (generated from SQLAlchemy models)
-- Enum types are created automatically by SQLAlchemy/Alembic; shown here as the app defines them.

CREATE TABLE amenities (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(80) NOT NULL, 
	slug VARCHAR(90) NOT NULL, 
	icon VARCHAR(80), 
	category VARCHAR(60), 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE cities (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	slug VARCHAR(140) NOT NULL, 
	country VARCHAR(80) NOT NULL, 
	state VARCHAR(120), 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	image_url VARCHAR(512), 
	description TEXT, 
	is_trending BOOLEAN NOT NULL, 
	property_count INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE coupons (
	id VARCHAR(36) NOT NULL, 
	code VARCHAR(30) NOT NULL, 
	description VARCHAR(200), 
	discount_percent FLOAT, 
	discount_flat NUMERIC(12, 2), 
	max_discount NUMERIC(12, 2), 
	min_booking_amount NUMERIC(12, 2) NOT NULL, 
	usage_limit INTEGER, 
	used_count INTEGER NOT NULL, 
	valid_from DATE, 
	valid_until DATE, 
	active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE faqs (
	id VARCHAR(36) NOT NULL, 
	question VARCHAR(300) NOT NULL, 
	answer TEXT NOT NULL, 
	category VARCHAR(80), 
	sort_order INTEGER NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE testimonials (
	id VARCHAR(36) NOT NULL, 
	author_name VARCHAR(160) NOT NULL, 
	author_role VARCHAR(120), 
	avatar_url VARCHAR(512), 
	rating INTEGER NOT NULL, 
	quote TEXT NOT NULL, 
	is_featured BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	phone VARCHAR(32), 
	hashed_password VARCHAR(255), 
	full_name VARCHAR(160) NOT NULL, 
	avatar_url VARCHAR(512), 
	role userrole NOT NULL, 
	gender gender, 
	date_of_birth DATE, 
	nationality VARCHAR(80), 
	google_id VARCHAR(255), 
	is_active BOOLEAN NOT NULL, 
	is_email_verified BOOLEAN NOT NULL, 
	is_phone_verified BOOLEAN NOT NULL, 
	kyc_status verificationstatus NOT NULL, 
	loyalty_points INTEGER NOT NULL, 
	referral_code VARCHAR(16), 
	referred_by_id VARCHAR(36), 
	last_login_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(referred_by_id) REFERENCES users (id)
);

CREATE TABLE audit_logs (
	id VARCHAR(36) NOT NULL, 
	actor_id VARCHAR(36), 
	action VARCHAR(80) NOT NULL, 
	entity_type VARCHAR(60), 
	entity_id VARCHAR(36), 
	ip_address VARCHAR(64), 
	metadata_json JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
);

CREATE TABLE blog_posts (
	id VARCHAR(36) NOT NULL, 
	title VARCHAR(250) NOT NULL, 
	slug VARCHAR(280) NOT NULL, 
	excerpt VARCHAR(400), 
	content TEXT NOT NULL, 
	cover_image_url VARCHAR(512), 
	author_id VARCHAR(36), 
	published BOOLEAN NOT NULL, 
	read_minutes INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(author_id) REFERENCES users (id)
);

CREATE TABLE documents (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	doc_type documenttype NOT NULL, 
	file_url VARCHAR(512) NOT NULL, 
	status verificationstatus NOT NULL, 
	reviewed_by_id VARCHAR(36), 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(reviewed_by_id) REFERENCES users (id)
);

CREATE TABLE host_profiles (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	company_name VARCHAR(200), 
	bio TEXT, 
	response_rate FLOAT NOT NULL, 
	response_time_minutes INTEGER, 
	verification_status verificationstatus NOT NULL, 
	quality_score FLOAT NOT NULL, 
	payout_account_id VARCHAR(120), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE loyalty_transactions (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	points INTEGER NOT NULL, 
	reason VARCHAR(160) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE marketplace_items (
	id VARCHAR(36) NOT NULL, 
	seller_id VARCHAR(36) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	description TEXT, 
	price NUMERIC(12, 2) NOT NULL, 
	category VARCHAR(80), 
	image_url VARCHAR(512), 
	sold BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(seller_id) REFERENCES users (id)
);

CREATE TABLE notifications (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	channel notificationchannel NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	body TEXT, 
	data JSONB NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	sent_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE properties (
	id VARCHAR(36) NOT NULL, 
	host_id VARCHAR(36) NOT NULL, 
	city_id VARCHAR(36) NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	slug VARCHAR(220) NOT NULL, 
	property_type propertytype NOT NULL, 
	status propertystatus NOT NULL, 
	summary VARCHAR(300), 
	description TEXT, 
	address VARCHAR(400) NOT NULL, 
	postal_code VARCHAR(20), 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	min_price NUMERIC(12, 2), 
	currency VARCHAR(3) NOT NULL, 
	avg_rating FLOAT NOT NULL, 
	review_count INTEGER NOT NULL, 
	view_count INTEGER NOT NULL, 
	cover_image_url VARCHAR(512), 
	video_tour_url VARCHAR(512), 
	tour_360_url VARCHAR(512), 
	floor_plan_url VARCHAR(512), 
	instant_booking BOOLEAN NOT NULL, 
	flexible_cancellation BOOLEAN NOT NULL, 
	price_match BOOLEAN NOT NULL, 
	bills_included BOOLEAN NOT NULL, 
	is_featured BOOLEAN NOT NULL, 
	is_verified BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(host_id) REFERENCES users (id), 
	FOREIGN KEY(city_id) REFERENCES cities (id)
);

CREATE TABLE push_subscriptions (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	endpoint VARCHAR(512) NOT NULL, 
	p256dh VARCHAR(255) NOT NULL, 
	auth VARCHAR(255) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	UNIQUE (endpoint)
);

CREATE TABLE referrals (
	id VARCHAR(36) NOT NULL, 
	referrer_id VARCHAR(36) NOT NULL, 
	referee_email VARCHAR(255) NOT NULL, 
	referee_id VARCHAR(36), 
	reward_points INTEGER NOT NULL, 
	converted BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(referrer_id) REFERENCES users (id), 
	FOREIGN KEY(referee_id) REFERENCES users (id)
);

CREATE TABLE roommate_profiles (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	gender_preference gender NOT NULL, 
	budget_min NUMERIC(12, 2), 
	budget_max NUMERIC(12, 2), 
	lifestyle JSONB NOT NULL, 
	bio TEXT, 
	looking BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE saved_searches (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	name VARCHAR(160) NOT NULL, 
	filters JSONB NOT NULL, 
	alert_enabled BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE support_tickets (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	subject VARCHAR(200) NOT NULL, 
	description TEXT NOT NULL, 
	status ticketstatus NOT NULL, 
	priority VARCHAR(20) NOT NULL, 
	assigned_to_id VARCHAR(36), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(assigned_to_id) REFERENCES users (id)
);

CREATE TABLE universities (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	slug VARCHAR(220) NOT NULL, 
	city_id VARCHAR(36) NOT NULL, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	logo_url VARCHAR(512), 
	is_top BOOLEAN NOT NULL, 
	student_count INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(city_id) REFERENCES cities (id)
);

CREATE TABLE nearby_pois (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	poi_type poitype NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	distance_km FLOAT NOT NULL, 
	walking_minutes INTEGER, 
	latitude FLOAT, 
	longitude FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE offers (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	description TEXT, 
	discount_percent FLOAT, 
	is_student_discount BOOLEAN NOT NULL, 
	active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE policies (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	policy_type VARCHAR(40) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	content TEXT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE property_amenities (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	amenity_id VARCHAR(36) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (property_id, amenity_id), 
	FOREIGN KEY(property_id) REFERENCES properties (id), 
	FOREIGN KEY(amenity_id) REFERENCES amenities (id)
);

CREATE TABLE property_faqs (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	question VARCHAR(300) NOT NULL, 
	answer TEXT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE property_images (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	url VARCHAR(512) NOT NULL, 
	caption VARCHAR(200), 
	is_cover BOOLEAN NOT NULL, 
	sort_order INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE property_universities (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	university_id VARCHAR(36) NOT NULL, 
	distance_km FLOAT NOT NULL, 
	walking_minutes INTEGER, 
	driving_minutes INTEGER, 
	transit_minutes INTEGER, 
	PRIMARY KEY (id), 
	UNIQUE (property_id, university_id), 
	FOREIGN KEY(property_id) REFERENCES properties (id), 
	FOREIGN KEY(university_id) REFERENCES universities (id)
);

CREATE TABLE recently_viewed (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	viewed_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, property_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE rooms (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	name VARCHAR(160) NOT NULL, 
	room_type roomtype NOT NULL, 
	description TEXT, 
	base_price NUMERIC(12, 2) NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	security_deposit NUMERIC(12, 2) NOT NULL, 
	cleaning_fee NUMERIC(12, 2) NOT NULL, 
	max_occupancy INTEGER NOT NULL, 
	total_units INTEGER NOT NULL, 
	size_sqft INTEGER, 
	gender_policy gender NOT NULL, 
	has_private_bathroom BOOLEAN NOT NULL, 
	has_kitchen BOOLEAN NOT NULL, 
	has_ac BOOLEAN NOT NULL, 
	floor_plan_url VARCHAR(512), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE verifications (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	status verificationstatus NOT NULL, 
	quality_score FLOAT NOT NULL, 
	reviewed_by_id VARCHAR(36), 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id), 
	FOREIGN KEY(reviewed_by_id) REFERENCES users (id)
);

CREATE TABLE wishlist_items (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, property_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE bookings (
	id VARCHAR(36) NOT NULL, 
	reference VARCHAR(20) NOT NULL, 
	student_id VARCHAR(36) NOT NULL, 
	room_id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	check_in DATE NOT NULL, 
	check_out DATE NOT NULL, 
	duration_months INTEGER NOT NULL, 
	guests INTEGER NOT NULL, 
	status bookingstatus NOT NULL, 
	rent_amount NUMERIC(12, 2) NOT NULL, 
	security_deposit NUMERIC(12, 2) NOT NULL, 
	cleaning_fee NUMERIC(12, 2) NOT NULL, 
	tax_amount NUMERIC(12, 2) NOT NULL, 
	discount_amount NUMERIC(12, 2) NOT NULL, 
	total_amount NUMERIC(12, 2) NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	coupon_id VARCHAR(36), 
	idempotency_key VARCHAR(64), 
	cancelled_at TIMESTAMP WITH TIME ZONE, 
	cancellation_reason TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(student_id) REFERENCES users (id), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id), 
	FOREIGN KEY(coupon_id) REFERENCES coupons (id)
);

CREATE TABLE room_availability (
	id VARCHAR(36) NOT NULL, 
	room_id VARCHAR(36) NOT NULL, 
	date DATE NOT NULL, 
	units_available INTEGER NOT NULL, 
	price_override NUMERIC(12, 2), 
	is_blocked BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (room_id, date), 
	FOREIGN KEY(room_id) REFERENCES rooms (id)
);

CREATE TABLE room_pricing (
	id VARCHAR(36) NOT NULL, 
	room_id VARCHAR(36) NOT NULL, 
	min_duration_months INTEGER NOT NULL, 
	price_per_month NUMERIC(12, 2) NOT NULL, 
	label VARCHAR(80), 
	PRIMARY KEY (id), 
	FOREIGN KEY(room_id) REFERENCES rooms (id)
);

CREATE TABLE conversations (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36), 
	booking_id VARCHAR(36), 
	last_message_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE coupon_redemptions (
	id VARCHAR(36) NOT NULL, 
	coupon_id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36) NOT NULL, 
	amount NUMERIC(12, 2) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (coupon_id, user_id, booking_id), 
	FOREIGN KEY(coupon_id) REFERENCES coupons (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE invoices (
	id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36) NOT NULL, 
	number VARCHAR(30) NOT NULL, 
	pdf_url VARCHAR(512), 
	amount NUMERIC(12, 2) NOT NULL, 
	issued_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE maintenance_requests (
	id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36) NOT NULL, 
	category VARCHAR(80) NOT NULL, 
	description TEXT NOT NULL, 
	status VARCHAR(30) NOT NULL, 
	priority VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE payments (
	id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36) NOT NULL, 
	provider VARCHAR(40) NOT NULL, 
	provider_intent_id VARCHAR(120), 
	amount NUMERIC(12, 2) NOT NULL, 
	currency VARCHAR(3) NOT NULL, 
	status paymentstatus NOT NULL, 
	method VARCHAR(40), 
	paid_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE refunds (
	id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36) NOT NULL, 
	amount NUMERIC(12, 2) NOT NULL, 
	reason TEXT, 
	status paymentstatus NOT NULL, 
	provider_refund_id VARCHAR(120), 
	processed_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE rental_agreements (
	id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36) NOT NULL, 
	document_url VARCHAR(512), 
	signed_by_student BOOLEAN NOT NULL, 
	signed_by_host BOOLEAN NOT NULL, 
	signed_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE reviews (
	id VARCHAR(36) NOT NULL, 
	property_id VARCHAR(36) NOT NULL, 
	author_id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36), 
	rating FLOAT NOT NULL, 
	cleanliness FLOAT, 
	location_rating FLOAT, 
	value_rating FLOAT, 
	facilities_rating FLOAT, 
	title VARCHAR(200), 
	comment TEXT NOT NULL, 
	is_verified BOOLEAN NOT NULL, 
	is_flagged BOOLEAN NOT NULL, 
	helpful_count INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id), 
	FOREIGN KEY(author_id) REFERENCES users (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE split_rents (
	id VARCHAR(36) NOT NULL, 
	booking_id VARCHAR(36) NOT NULL, 
	payer_id VARCHAR(36) NOT NULL, 
	share_amount NUMERIC(12, 2) NOT NULL, 
	paid BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id), 
	FOREIGN KEY(payer_id) REFERENCES users (id)
);

CREATE TABLE conversation_participants (
	conversation_id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	PRIMARY KEY (conversation_id, user_id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE messages (
	id VARCHAR(36) NOT NULL, 
	conversation_id VARCHAR(36) NOT NULL, 
	sender_id VARCHAR(36) NOT NULL, 
	body TEXT, 
	attachment_url VARCHAR(512), 
	attachment_type VARCHAR(20), 
	is_read BOOLEAN NOT NULL, 
	read_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id), 
	FOREIGN KEY(sender_id) REFERENCES users (id)
);

CREATE TABLE review_photos (
	id VARCHAR(36) NOT NULL, 
	review_id VARCHAR(36) NOT NULL, 
	url VARCHAR(512) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(review_id) REFERENCES reviews (id)
);

CREATE TABLE review_replies (
	id VARCHAR(36) NOT NULL, 
	review_id VARCHAR(36) NOT NULL, 
	author_id VARCHAR(36) NOT NULL, 
	comment TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(review_id) REFERENCES reviews (id), 
	FOREIGN KEY(author_id) REFERENCES users (id)
);


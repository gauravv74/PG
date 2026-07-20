"""Seed demo data so the app is usable immediately: python -m app.db.seed."""
from __future__ import annotations

import random
from datetime import date, timedelta

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    FAQ,
    Amenity,
    BlogPost,
    City,
    HostProfile,
    NearbyPOI,
    Offer,
    Property,
    PropertyAmenity,
    PropertyImage,
    PropertyUniversity,
    Room,
    RoomAvailability,
    Testimonial,
    University,
    User,
)
from app.models.enums import (
    Gender,
    POIType,
    PropertyStatus,
    PropertyType,
    RoomType,
    UserRole,
)

CITIES = [
    ("Pune", "India", 18.5204, 73.8567, True),
    ("Bengaluru", "India", 12.9716, 77.5946, True),
    ("Mumbai", "India", 19.0760, 72.8777, True),
    ("London", "UK", 51.5074, -0.1278, True),
    ("Manchester", "UK", 53.4808, -2.2426, False),
    ("Melbourne", "Australia", -37.8136, 144.9631, True),
]

UNIS = {
    "Pune": [("Savitribai Phule Pune University", 18.5539, 73.8256),
             ("VIT Pune", 18.4633, 73.8683)],
    "Bengaluru": [("Indian Institute of Science", 13.0219, 77.5671)],
    "London": [("Imperial College London", 51.4988, -0.1749),
               ("UCL", 51.5246, -0.1340)],
    "Manchester": [("University of Manchester", 53.4668, -2.2339)],
    "Melbourne": [("University of Melbourne", -37.7963, 144.9614)],
    "Mumbai": [("IIT Bombay", 19.1334, 72.9133)],
}

AMENITIES = [
    ("WiFi", "wifi", "wifi"), ("Gym", "gym", "dumbbell"), ("Laundry", "laundry", "washer"),
    ("Parking", "parking", "car"), ("Study Room", "study-room", "book"), ("AC", "ac", "snowflake"),
    ("Heating", "heating", "flame"), ("Pet Friendly", "pet-friendly", "paw"),
    ("Wheelchair Accessible", "wheelchair-accessible", "wheelchair"),
    ("24x7 Security", "security-24x7", "shield"), ("CCTV", "cctv", "camera"),
    ("Elevator", "elevator", "elevator"),
]

IMG = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(City).count() > 0:
        print("Already seeded.")
        db.close()
        return

    amenities = [Amenity(name=n, slug=s, icon=i, category="general") for n, s, i in AMENITIES]
    db.add_all(amenities)

    host = User(
        email="host@uninest.app", full_name="Demo Host", role=UserRole.host,
        hashed_password=hash_password("password123"), is_email_verified=True,
        referral_code="HOST01",
    )
    student = User(
        email="student@uninest.app", full_name="Demo Student", role=UserRole.student,
        hashed_password=hash_password("password123"), is_email_verified=True,
        referral_code="STU01",
    )
    admin = User(
        email="admin@uninest.app", full_name="Admin", role=UserRole.admin,
        hashed_password=hash_password("password123"), is_email_verified=True,
        referral_code="ADM01",
    )
    db.add_all([host, student, admin])
    db.flush()
    db.add(HostProfile(user_id=host.id, company_name="UniNest Managed", quality_score=92))

    for cname, country, lat, lng, trending in CITIES:
        city = City(
            name=cname, slug=cname.lower(), country=country, latitude=lat, longitude=lng,
            is_trending=trending, image_url=IMG,
        )
        db.add(city)
        db.flush()

        unis = []
        for uname, ulat, ulng in UNIS.get(cname, []):
            u = University(
                name=uname, slug=uname.lower().replace(" ", "-"), city_id=city.id,
                latitude=ulat, longitude=ulng, is_top=True, student_count=25000,
            )
            db.add(u)
            db.flush()
            unis.append(u)

        for i in range(6):
            ptype = random.choice(list(PropertyType))
            price = random.choice([9000, 12000, 15000, 18000, 22000, 30000])
            prop = Property(
                host_id=host.id, city_id=city.id,
                name=f"{cname} Student Living {i + 1}",
                slug=f"{cname.lower()}-student-living-{i + 1}",
                property_type=ptype, status=PropertyStatus.active,
                summary="Modern student home with all bills included.",
                description="Bright, fully-furnished student accommodation close to campus, "
                            "with high-speed WiFi, study spaces, and a vibrant community.",
                address=f"{i + 1} Campus Road, {cname}",
                latitude=lat + random.uniform(-0.03, 0.03),
                longitude=lng + random.uniform(-0.03, 0.03),
                min_price=price, currency="INR" if country == "India" else "GBP",
                avg_rating=round(random.uniform(4.0, 5.0), 1),
                review_count=random.randint(10, 240),
                view_count=random.randint(100, 5000),
                cover_image_url=IMG, is_featured=(i < 2), is_verified=True,
                instant_booking=(i % 2 == 0), flexible_cancellation=True, bills_included=True,
            )
            db.add(prop)
            db.flush()

            db.add_all([PropertyImage(property_id=prop.id, url=IMG, is_cover=(j == 0), sort_order=j)
                        for j in range(4)])
            for am in random.sample(amenities, k=6):
                db.add(PropertyAmenity(property_id=prop.id, amenity_id=am.id))
            for u in unis:
                dist = round(random.uniform(0.4, 4.5), 1)
                db.add(PropertyUniversity(
                    property_id=prop.id, university_id=u.id, distance_km=dist,
                    walking_minutes=int(dist * 12), driving_minutes=int(dist * 3),
                    transit_minutes=int(dist * 6),
                ))
            db.add_all([
                NearbyPOI(property_id=prop.id, poi_type=POIType.metro, name="Central Metro",
                          distance_km=0.5, walking_minutes=6),
                NearbyPOI(property_id=prop.id, poi_type=POIType.grocery, name="FreshMart",
                          distance_km=0.2, walking_minutes=3),
                NearbyPOI(property_id=prop.id, poi_type=POIType.hospital, name="City Hospital",
                          distance_km=1.2, walking_minutes=15),
            ])
            if i % 3 == 0:
                db.add(Offer(property_id=prop.id, title="Early Bird 10% Off",
                             discount_percent=10, is_student_discount=True))

            for rt in random.sample(list(RoomType), k=3):
                room = Room(
                    property_id=prop.id, name=f"{rt.value.title()} Room", room_type=rt,
                    base_price=price + random.choice([0, 2000, 4000]),
                    security_deposit=price, cleaning_fee=1500,
                    currency=prop.currency, max_occupancy=2 if "sharing" in rt.value else 1,
                    total_units=random.randint(2, 8), gender_policy=Gender.any,
                    has_private_bathroom=(rt in (RoomType.ensuite, RoomType.studio)),
                    has_kitchen=(rt in (RoomType.studio, RoomType.apartment)),
                    has_ac=True,
                )
                db.add(room)
                db.flush()
                today = date.today()
                db.add_all([
                    RoomAvailability(room_id=room.id, date=today + timedelta(days=d),
                                     units_available=room.total_units)
                    for d in range(120)
                ])

    db.add_all([
        Testimonial(author_name="Ananya S.", author_role="MSc, Pune", rating=5,
                    quote="Booked my studio in 10 minutes. The verified badge gave me confidence!"),
        Testimonial(author_name="Rahul K.", author_role="Undergrad, London", rating=5,
                    quote="Loved the map view and commute times to my university."),
        Testimonial(author_name="Wei L.", author_role="PhD, Melbourne", rating=5,
                    quote="The AI search understood exactly what I needed. Superb experience."),
    ])
    db.add_all([
        FAQ(question="Are bills included?", answer="Most listings include bills; look for the "
            "'Bills included' badge.", category="booking", sort_order=1),
        FAQ(question="Is my deposit protected?", answer="Yes, deposits are held securely and "
            "refunded per the property's deposit policy.", category="payments", sort_order=2),
        FAQ(question="Can I cancel for free?", answer="Listings marked 'Flexible cancellation' "
            "offer free cancellation up to 30 days before move-in.", category="booking",
            sort_order=3),
    ])
    db.add_all([
        BlogPost(title="Ultimate Guide to Student Housing in 2026", slug="student-housing-2026",
                 excerpt="Everything you need to know before you book.",
                 content="...", cover_image_url=IMG, published=True, read_minutes=6),
        BlogPost(title="Budgeting Tips for International Students", slug="budgeting-tips",
                 excerpt="Stretch your money further abroad.",
                 content="...", cover_image_url=IMG, published=True, read_minutes=4),
    ])

    for c in db.query(City).all():
        c.property_count = db.query(Property).filter(Property.city_id == c.id).count()

    db.commit()
    db.close()
    print("Seed complete. Logins: student@ / host@ / admin@uninest.app  (password123)")


if __name__ == "__main__":
    run()

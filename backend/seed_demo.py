"""
Seed three demo accounts for SIH judges.

Run once after migrations:
    python seed_demo.py

Each user gets a different role so judges can explore every perspective.
Password for all three: password123
"""

from app.db import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.station import Station
from app.security import get_password_hash

DEMO_PASSWORD = "password123"

DEMO_USERS = [
    {
        "username": "demo_command",
        "email": "demo_command@dhruv.demo",
        "full_name": "Demo Command Officer",
        "role_name": "Command",
    },
    {
        "username": "demo_station",
        "email": "demo_station@dhruv.demo",
        "full_name": "Demo Station Leader",
        "role_name": "Station Leader",
    },
    {
        "username": "demo_field",
        "email": "demo_field@dhruv.demo",
        "full_name": "Demo Field Member",
        "role_name": "Field Team Member",
    },
]


def seed_demo():
    db = SessionLocal()

    # Grab Bharati (id=1) or the first active station as default
    station = db.query(Station).filter(Station.is_active == True).first()
    station_id = station.id if station else None

    hashed = get_password_hash(DEMO_PASSWORD)

    for entry in DEMO_USERS:
        role = db.query(Role).filter(Role.name == entry["role_name"]).first()
        if not role:
            print(f"  ⚠ Role '{entry['role_name']}' not found – skipping {entry['username']}")
            continue

        user = db.query(User).filter(User.username == entry["username"]).first()
        if user:
            # Force-refresh the password hash so it works with FastAPI/passlib
            user.password_hash = hashed
            user.role_id = role.id
            user.station_id = station_id
            print(f"  ✔ Updated existing '{entry['username']}' (role={role.name})")
        else:
            user = User(
                username=entry["username"],
                email=entry["email"],
                full_name=entry["full_name"],
                password_hash=hashed,
                role_id=role.id,
                station_id=station_id,
                is_active=True,
            )
            db.add(user)
            print(f"  ✔ Created '{entry['username']}' (role={role.name})")

    db.commit()
    db.close()
    print("\nDemo accounts ready. Password for all three: password123")


if __name__ == "__main__":
    seed_demo()

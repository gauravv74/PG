"""Add geohash column and geo/composite indexes to properties (Map Search).

Defensive/idempotent: the project can bootstrap the schema via
``Base.metadata.create_all`` (see app/db/seed.py), so this migration inspects
the live schema and only creates objects that are missing. This makes it safe to
run whether or not the geo objects already exist.

Revision ID: 0001_property_geo
Revises:
Create Date: 2026-07-21
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001_property_geo"
down_revision = None
branch_labels = None
depends_on = None

TABLE = "properties"
INDEXES = {
    "ix_properties_lat_lng": ["latitude", "longitude"],
    "ix_properties_geohash": ["geohash"],
    "ix_properties_status_city_price": ["status", "city_id", "min_price"],
}


def _inspector():
    return sa.inspect(op.get_bind())


def upgrade() -> None:
    insp = _inspector()
    if TABLE not in insp.get_table_names():
        return  # fresh DB; create_all will build everything including these.

    columns = {c["name"] for c in insp.get_columns(TABLE)}
    if "geohash" not in columns:
        op.add_column(TABLE, sa.Column("geohash", sa.String(length=12), nullable=True))

    existing = {ix["name"] for ix in insp.get_indexes(TABLE)}
    for name, cols in INDEXES.items():
        if name not in existing:
            op.create_index(name, TABLE, cols)


def downgrade() -> None:
    insp = _inspector()
    if TABLE not in insp.get_table_names():
        return

    existing = {ix["name"] for ix in insp.get_indexes(TABLE)}
    for name in INDEXES:
        if name in existing:
            op.drop_index(name, table_name=TABLE)

    columns = {c["name"] for c in insp.get_columns(TABLE)}
    if "geohash" in columns:
        op.drop_column(TABLE, "geohash")

from app.services.ai_service import _rule_based_parse


def test_parse_studio_under_budget():
    f = _rule_based_parse("I need a studio under ₹15,000 near Pune University")
    assert f.price_max == 15000
    assert f.room_type and f.room_type[0].value == "studio"
    assert "pune university" in (f.query or "").lower()


def test_parse_girls_pg_with_food():
    f = _rule_based_parse("Girls PG near VIT Pune with food")
    assert f.gender and f.gender.value == "female"


def test_parse_metro_commute():
    f = _rule_based_parse("Private room within 10 minutes of metro")
    assert f.max_commute_minutes == 10
    assert f.room_type and f.room_type[0].value == "private"

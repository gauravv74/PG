from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("secret-password")
    assert hashed != "secret-password"
    assert verify_password("secret-password", hashed)
    assert not verify_password("wrong", hashed)


def test_access_token_encode_decode():
    token = create_access_token("user-123", "student")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "student"
    assert payload["type"] == "access"

# UniNest — API Reference

Base URL: `/api/v1` · Interactive docs: `GET /docs` (Swagger) and `GET /redoc`.
Auth: send `Authorization: Bearer <access_token>` (obtain via `/auth/*`).

The list below is generated from the running app. Full request/response schemas are in the
OpenAPI spec at `/openapi.json`.

## System
| Method | Path | Description |
|---|---|---|
| GET | `/` | Service info |
| GET | `/health` | Liveness probe |

## Auth (Module 15)
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account → access + refresh tokens |
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/auth/google` | Google id_token login |
| POST | `/api/v1/auth/refresh` | Rotate refresh → new access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/auth/me` | Current user profile |

## Discovery — Landing (Module 1)
| Method | Path |
|---|---|
| GET | `/api/v1/discovery/trending-cities` |
| GET | `/api/v1/discovery/featured-properties` |
| GET | `/api/v1/discovery/recommended` |
| GET | `/api/v1/discovery/top-universities` |
| GET | `/api/v1/discovery/special-offers` |
| GET | `/api/v1/discovery/recently-viewed` |
| GET | `/api/v1/discovery/testimonials` |
| GET | `/api/v1/discovery/stats` |
| GET | `/api/v1/discovery/blogs` |
| GET | `/api/v1/discovery/faqs` |

## Search (Module 2)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/search` | 30+ query-param filters, `sort`, `page`, `page_size`; returns `Page<PropertyCard>` |

Example:
```
GET /api/v1/search?city_id=<id>&price_max=15000&room_type=studio&wifi=true&sort=lowest_price&page=1
```

## Properties (Module 3, 4, 7)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/properties/{slug}` | Full detail (gallery, rooms, POIs, offers, policies) |
| GET | `/api/v1/properties/{slug}/similar` | AI similar listings |
| POST | `/api/v1/properties` | Host: create listing |
| POST | `/api/v1/properties/{property_id}/rooms` | Host: add room type |
| POST | `/api/v1/properties/{property_id}/submit` | Host: submit for verification |

## Bookings (Module 5)
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/bookings/quote` | Live price + availability quote |
| POST | `/api/v1/bookings` | Create booking (idempotent, locks inventory) |
| POST | `/api/v1/bookings/{id}/confirm-payment` | Confirm after payment → invoice + notifications |
| GET | `/api/v1/bookings` | My bookings |
| POST | `/api/v1/bookings/{id}/cancel` | Cancel + policy-based refund |

## Reviews (Module 10)
| Method | Path |
|---|---|
| GET | `/api/v1/reviews/property/{property_id}` |
| POST | `/api/v1/reviews` |
| POST | `/api/v1/reviews/{review_id}/reply` |
| POST | `/api/v1/reviews/{review_id}/report` |

## Messaging (Module 9)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/messaging/conversations` | My conversations |
| GET | `/api/v1/messaging/conversations/{id}/messages` | History |
| POST | `/api/v1/messaging/messages` | Send (text / image / pdf) |
| WS | `/api/v1/messaging/ws/{conversation_id}?token=` | Real-time chat, typing, read receipts |

## Notifications (Module 14)
| Method | Path |
|---|---|
| GET | `/api/v1/notifications` |
| POST | `/api/v1/notifications/{id}/read` |
| POST | `/api/v1/notifications/read-all` |
| POST | `/api/v1/notifications/push/subscribe` |

## AI (Module 13)
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/ai/parse-search` | Natural language → `SearchFilters` |
| GET | `/api/v1/ai/budget-suggestion` | Smart budget for a city |
| POST | `/api/v1/ai/chat` | Chatbot reply + suggested filters |

## Student Dashboard (Module 6)
| Method | Path |
|---|---|
| GET | `/api/v1/students/dashboard` |
| GET/POST/DELETE | `/api/v1/students/wishlist[/{property_id}]` |
| GET/POST | `/api/v1/students/saved-searches` |

## Host Dashboard (Module 7)
| Method | Path |
|---|---|
| GET | `/api/v1/host/dashboard` |
| GET | `/api/v1/host/properties` |
| GET | `/api/v1/host/bookings` |
| GET | `/api/v1/host/analytics` |

## Admin (Module 8, 11)
| Method | Path |
|---|---|
| GET | `/api/v1/admin/overview` |
| GET | `/api/v1/admin/properties/pending` |
| POST | `/api/v1/admin/properties/{id}/moderate` |
| POST | `/api/v1/admin/reviews/{id}/moderate` |
| POST | `/api/v1/admin/coupons` |

## Uploads (Module 3, 11, 15)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/uploads/image` | Cloudinary upload, MIME/size validated |
| POST | `/api/v1/uploads/document` | PDF verification docs |

## Error format
All errors use FastAPI's standard shape:
```json
{ "detail": "Human-readable message" }
```
Common codes: `400` validation, `401` unauthenticated, `403` forbidden (RBAC),
`404` not found, `409` conflict (double booking / duplicate email), `429` rate limited.

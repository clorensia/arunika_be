# ARUNIKA API Documentation

## Overview

ARUNIKA API adalah backend service untuk platform career development yang menyediakan rekomendasi pekerjaan dan skill berdasarkan profil user. API ini dibangun dengan Express.js dan Supabase PostgreSQL.

**Base URL:** `http://localhost:5000/api`

**Response Format:**
```json
{
  "success": true/false,
  "data": {...},
  "error": null,
  "message": "success message",
  "timestamp": "2025-10-21T22:45:43.588Z"
}
```

---

## Database Schema

### Users
Menyimpan informasi user.

| Field | Type | Deskripsi |
|-------|------|-----------|
| user_id | UUID | Primary key |
| name | VARCHAR | Nama lengkap user |
| email | VARCHAR | Email (unique) |
| password | VARCHAR | Password |
| tanggal_daftar | TIMESTAMP | Tanggal registrasi |
| role | VARCHAR | Role user (default: 'user') |
| pendidikan | VARCHAR | Latar belakang pendidikan |
| pekerjaan | VARCHAR | Pekerjaan saat ini |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

### Pekerjaan
Daftar semua job listings yang tersedia di platform.

| Field | Type | Deskripsi |
|-------|------|-----------|
| pekerjaan_id | UUID | Primary key |
| nama_pekerjaan | VARCHAR | Nama posisi kerja |
| bidang | VARCHAR | Bidang industri |
| link_pekerjaan | VARCHAR | URL job listing |
| deskripsi | TEXT | Deskripsi pekerjaan |
| requirements | TEXT | Requirements & qualifications |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

### SkillUp
Daftar semua kursus/courses yang tersedia untuk skill development.

| Field | Type | Deskripsi |
|-------|------|-----------|
| skill_id | UUID | Primary key |
| nama_skillup | VARCHAR | Nama course/skill |
| link_skillup | VARCHAR | URL course |
| deskripsi | TEXT | Deskripsi skill |
| level | VARCHAR | Level (beginner, intermediate, advanced) |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

### Personalized
Profil rekomendasi yang di-personalisasi untuk setiap user.

| Field | Type | Deskripsi |
|-------|------|-----------|
| rec_id | UUID | Primary key |
| user_id | UUID | Foreign key ke Users |
| role_fit | VARCHAR | Role yang cocok untuk user |
| strength | VARCHAR | Kekuatan/strength user |
| skill_gap | VARCHAR | Gap skill yang perlu dikembangkan |
| level | VARCHAR | Level profesional user |
| gap | VARCHAR | Gap tahun pengalaman |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

### Rec Pekerjaan (Junction Table)
Menghubungkan personalized recommendations ke job listings.

| Field | Type | Deskripsi |
|-------|------|-----------|
| repekerjaan_id | UUID | Primary key |
| rec_id | UUID | Foreign key ke Personalized |
| pekerjaan_id | UUID | Foreign key ke Pekerjaan |
| created_at | TIMESTAMP | Created timestamp |

### Rec SkillUp (Junction Table)
Menghubungkan personalized recommendations ke skill courses.

| Field | Type | Deskripsi |
|-------|------|-----------|
| recskillup_id | UUID | Primary key |
| rec_id | UUID | Foreign key ke Personalized |
| skill_id | UUID | Foreign key ke SkillUp |
| created_at | TIMESTAMP | Created timestamp |

---

## API Endpoints

### USERS

#### GET All Users (dengan pagination)
```
GET /users?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "total": 50,
      "limit": 10,
      "page": 1
    }
  }
}
```

#### GET Single User
```
GET /users/{user_id}
```

#### POST Create User
```
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "pendidikan": "S1 Informatika",
  "pekerjaan": "Software Engineer"
}
```

**Status Code:** 201 Created

#### PUT Update User
```
PUT /users/{user_id}
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.new@example.com",
  "pendidikan": "S2 Informatika"
}
```

**Status Code:** 200 OK

#### DELETE User
```
DELETE /users/{user_id}
```

**Status Code:** 200 OK

---

### PEKERJAAN (Jobs)

#### GET All Jobs (dengan filter & pagination)
```
GET /pekerjaan?page=1&limit=10
GET /pekerjaan?bidang=Technology&page=1&limit=10
```

#### GET Single Job
```
GET /pekerjaan/{pekerjaan_id}
```

#### POST Create Job
```
POST /pekerjaan
Content-Type: application/json

{
  "nama_pekerjaan": "Senior Backend Developer",
  "bidang": "Technology",
  "link_pekerjaan": "https://example.com/jobs/backend",
  "deskripsi": "Looking for experienced backend developer",
  "requirements": "5+ years Node.js, PostgreSQL"
}
```

**Status Code:** 201 Created

#### PUT Update Job
```
PUT /pekerjaan/{pekerjaan_id}
Content-Type: application/json

{
  "nama_pekerjaan": "Senior Backend Developer",
  "bidang": "Technology"
}
```

**Status Code:** 200 OK

#### DELETE Job
```
DELETE /pekerjaan/{pekerjaan_id}
```

**Status Code:** 200 OK

---

### SKILLUP (Courses)

#### GET All Skills (dengan filter & pagination)
```
GET /skillup?page=1&limit=10
GET /skillup?level=intermediate&page=1&limit=10
```

#### GET Single Skill
```
GET /skillup/{skill_id}
```

#### POST Create Skill
```
POST /skillup
Content-Type: application/json

{
  "nama_skillup": "Advanced Node.js",
  "link_skillup": "https://example.com/courses/nodejs",
  "deskripsi": "Learn advanced Node.js concepts",
  "level": "intermediate"
}
```

**Status Code:** 201 Created

#### PUT Update Skill
```
PUT /skillup/{skill_id}
Content-Type: application/json

{
  "nama_skillup": "Advanced Node.js & Express",
  "level": "advanced"
}
```

**Status Code:** 200 OK

#### DELETE Skill
```
DELETE /skillup/{skill_id}
```

**Status Code:** 200 OK

---

### PERSONALIZED

#### GET User Personalizations
```
GET /users/{user_id}/personalized?page=1&limit=10
```

#### GET Single Personalization
```
GET /personalized/{rec_id}
```

#### POST Create Personalization
```
POST /personalized
Content-Type: application/json

{
  "user_id": "89c14d3d-e0a7-47d8-bbdc-82045dae43e3",
  "role_fit": "Full Stack Developer",
  "strength": "Backend Development, Problem Solving",
  "skill_gap": "Frontend Development, DevOps",
  "level": "Junior",
  "gap": "2-3 years"
}
```

**Status Code:** 201 Created

#### PUT Update Personalization
```
PUT /personalized/{rec_id}
Content-Type: application/json

{
  "role_fit": "Senior Full Stack Developer",
  "strength": "Backend, Frontend, DevOps",
  "level": "Mid-Level"
}
```

**Status Code:** 200 OK

---

### REC PEKERJAAN (Job Recommendations)

#### GET Job Recommendations for Personalization
```
GET /personalized/{rec_id}/jobs?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "repekerjaan_id": "xxx",
        "created_at": "2025-10-21T...",
        "pekerjaan": {
          "pekerjaan_id": "xxx",
          "nama_pekerjaan": "Senior Backend Developer",
          "bidang": "Technology",
          "link_pekerjaan": "...",
          "deskripsi": "..."
        }
      }
    ],
    "pagination": {...}
  }
}
```

#### POST Add Job to Recommendations
```
POST /rec-pekerjaan
Content-Type: application/json

{
  "rec_id": "ba6cc4b4-4525-42b9-9395-4d102760eca6",
  "pekerjaan_id": "e3e85f45-604e-44ac-9f67-502dc40bda31"
}
```

**Status Code:** 201 Created

#### DELETE Remove Job from Recommendations
```
DELETE /rec-pekerjaan/{repekerjaan_id}
```

**Status Code:** 200 OK

---

### REC SKILLUP (Skill Recommendations)

#### GET Skill Recommendations for Personalization
```
GET /personalized/{rec_id}/skills?page=1&limit=10
```

#### POST Add Skill to Recommendations
```
POST /rec-skillup
Content-Type: application/json

{
  "rec_id": "ba6cc4b4-4525-42b9-9395-4d102760eca6",
  "skill_id": "4e56de2d-4bf0-47f6-a7a9-be4653c55030"
}
```

**Status Code:** 201 Created

#### DELETE Remove Skill from Recommendations
```
DELETE /rec-skillup/{recskillup_id}
```

**Status Code:** 200 OK

---

### COMPLETE PROFILE (Complex Query)

#### GET Complete User Profile with All Nested Data
```
GET /profile/{user_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "89c14d3d-e0a7-47d8-bbdc-82045dae43e3",
      "name": "John Doe",
      "email": "john@example.com",
      "pendidikan": "S1 Informatika",
      "pekerjaan": "Software Engineer",
      "created_at": "2025-10-21T..."
    },
    "personalizations": [
      {
        "rec_id": "ba6cc4b4-4525-42b9-9395-4d102760eca6",
        "user_id": "89c14d3d-e0a7-47d8-bbdc-82045dae43e3",
        "role_fit": "Full Stack Developer",
        "strength": "Backend Development",
        "skill_gap": "Frontend",
        "rec_pekerjaan": [
          {
            "repekerjaan_id": "xxx",
            "pekerjaan": {
              "pekerjaan_id": "e3e85f45-604e-44ac-9f67-502dc40bda31",
              "nama_pekerjaan": "Senior Backend Developer",
              "bidang": "Technology",
              "link_pekerjaan": "...",
              "deskripsi": "..."
            }
          }
        ],
        "rec_skillup": [
          {
            "recskillup_id": "xxx",
            "skillup": {
              "skill_id": "4e56de2d-4bf0-47f6-a7a9-be4653c55030",
              "nama_skillup": "Advanced Node.js",
              "link_skillup": "...",
              "deskripsi": "...",
              "level": "intermediate"
            }
          }
        ]
      }
    ]
  }
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource baru berhasil dibuat |
| 400 | Bad Request - Input tidak valid / Foreign key constraint violated |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Server Error - Error di server |

---

## Error Response

Semua error mengikuti format:

```json
{
  "success": false,
  "data": null,
  "error": "Deskripsi error",
  "message": null,
  "timestamp": "2025-10-21T22:45:43.588Z"
}
```

---

## Pagination

Semua GET endpoints yang mengembalikan list data mendukung pagination:

**Query Parameters:**
- `page` (default: 1) - Halaman yang diinginkan
- `limit` (default: 10) - Jumlah data per halaman

**Response Pagination:**
```json
{
  "pagination": {
    "total": 50,
    "limit": 10,
    "page": 1
  }
}
```

---

## Relationships & Foreign Keys

**Users → Personalized** (1 to Many)
- 1 user bisa punya banyak personalized recommendations

**Personalized → Pekerjaan** (Many to Many via rec_pekerjaan)
- 1 personalization bisa link ke banyak pekerjaan
- 1 pekerjaan bisa di-recommend ke banyak personalizations

**Personalized → SkillUp** (Many to Many via rec_skillup)
- 1 personalization bisa link ke banyak skill courses
- 1 skill course bisa di-recommend ke banyak personalizations

---

## Testing dengan Postman/VS Code REST Client

1. Import collection dari Postman workspace
2. Atau gunakan VS Code REST Client dengan file `requests.http`

**Example Testing Flow:**
1. POST /users → copy user_id
2. POST /pekerjaan → copy pekerjaan_id
3. POST /skillup → copy skill_id
4. POST /personalized (gunakan user_id) → copy rec_id
5. POST /rec-pekerjaan (gunakan rec_id + pekerjaan_id)
6. POST /rec-skillup (gunakan rec_id + skill_id)
7. GET /profile/{user_id} → lihat semua nested data

---

## Security

- Rate limiting: 100 requests per minute per IP
- CORS enabled
- Helmet.js untuk security headers
- All input divalidasi sebelum database operation

---

## Environment Setup

### .env
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=5000
```

### Run Development
```bash
npm install
npm run dev
```

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via Supabase)
- **ORM/Client:** Supabase JS Client
- **Security:** Helmet.js, CORS, Rate Limiting
- **Dev Tools:** Nodemon, Dotenv
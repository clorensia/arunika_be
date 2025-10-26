# ARUNIKA API Documentation

## Overview

ARUNIKA API adalah backend service untuk platform career development yang menyediakan rekomendasi pekerjaan dan skill berdasarkan profil user. API ini dibangun dengan Express.js dan Supabase PostgreSQL.

**Base URL (Production):** `https://arunikabe-production.up.railway.app/api`

**Base URL (Development):** `http://localhost:5000/api`

**Response Format:**
```json
{
  "success": true/false,
  "data": {...},
  "error": null,
  "message": "success message",
  "timestamp": "2025-10-24T18:48:29.860Z"
}
```

---

## Deployment Status

✅ **Backend Live di Production**
- Platform: Railway
- Status: Active & Running
- URL: https://arunikabe-production.up.railway.app
- Environment: Node.js v22.21.0
- Region: Asia Southeast 1 (Singapore)

---

## Database Schema

### Users
Menyimpan informasi user dan profil.

| Field | Type | Deskripsi |
|-------|------|-----------|
| user_id | UUID | Primary key |
| name | VARCHAR | Nama lengkap user |
| email | VARCHAR | Email (unique) |
| role | VARCHAR | Role user (default: 'user') |
| pendidikan | VARCHAR | Latar belakang pendidikan |
| pekerjaan | VARCHAR | Pekerjaan saat ini |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

**Note:** Password disimpan di Supabase Auth, bukan di tabel users.

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

### Skill Questions
Daftar pertanyaan untuk skill matching quiz.

| Field | Type | Deskripsi |
|-------|------|-----------|
| id | SERIAL | Primary key |
| text | TEXT | Pertanyaan yang ditanyakan |
| trait | VARCHAR | Trait yang diukur (analysis, innovation, collab, creative) |
| category | VARCHAR | Kategori pertanyaan |
| role_category | VARCHAR | Role terkait (Backend Developer, UI/UX Designer, Frontend Developer, Product Manager) |
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

### HEALTH CHECK

#### Server Status
```
GET /health
```

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2025-10-24T18:48:29.860Z",
  "environment": "production"
}
```

---

### AUTHENTICATION

#### Register User
```
POST /api/auth/register
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

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "profile": {...},
    "session": {...},
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer {access_token}
```

#### Logout (Protected)
```
POST /api/auth/logout
Authorization: Bearer {access_token}
```

#### Update Password (Protected)
```
PUT /api/auth/update-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "password": "newpassword123"
}
```

#### Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "..."
}
```

---

### USERS

#### GET All Users (dengan pagination)
```
GET /api/users?page=1&limit=10
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
GET /api/users/{user_id}
```

#### PUT Update User (Protected - own profile only)
```
PUT /api/users/{user_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "John Updated",
  "pendidikan": "S2 Informatika",
  "pekerjaan": "Senior Software Engineer"
}
```

**Status Code:** 200 OK

#### DELETE User (Protected - own account only)
```
DELETE /api/users/{user_id}
Authorization: Bearer {access_token}
```

**Status Code:** 200 OK

---

### SKILL QUESTIONS (NEW)

#### GET All Skill Questions (PUBLIC)
```
GET /api/skill-questions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "text": "Saya suka memecahkan masalah kompleks dan mencari solusi inovatif.",
        "trait": "innovation",
        "category": "problem-solving",
        "role_category": "Backend Developer"
      }
    ],
    "count": 12
  }
}
```

#### GET Questions by Role Category (PUBLIC)
```
GET /api/skill-questions?role_category=Backend%20Developer
```

**Query Parameters:**
- `role_category` - Filter by role: `Backend Developer`, `UI/UX Designer`, `Frontend Developer`, `Product Manager`

#### GET All Role Categories (PUBLIC)
```
GET /api/skill-questions/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      "Backend Developer",
      "UI/UX Designer",
      "Frontend Developer",
      "Product Manager"
    ]
  }
}
```

#### GET Single Question (PUBLIC)
```
GET /api/skill-questions/{question_id}
```

#### POST Create Question (Protected)
```
POST /api/skill-questions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "text": "Saya selalu mengoptimalkan kode untuk performa maksimal.",
  "trait": "analysis",
  "category": "optimization",
  "role_category": "Backend Developer"
}
```

**Valid Traits:** `analysis`, `innovation`, `collab`, `creative`

**Valid Roles:** `Backend Developer`, `UI/UX Designer`, `Frontend Developer`, `Product Manager`

**Status Code:** 201 Created

#### PUT Update Question (Protected)
```
PUT /api/skill-questions/{question_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "text": "Updated question text"
}
```

**Status Code:** 200 OK

#### DELETE Question (Protected)
```
DELETE /api/skill-questions/{question_id}
Authorization: Bearer {access_token}
```

**Status Code:** 200 OK

---

### PEKERJAAN (Jobs)

#### GET All Jobs (dengan filter & pagination)
```
GET /api/pekerjaan?page=1&limit=10
GET /api/pekerjaan?bidang=Technology&page=1&limit=10
```

#### GET Single Job
```
GET /api/pekerjaan/{pekerjaan_id}
```

#### POST Create Job (Protected)
```
POST /api/pekerjaan
Authorization: Bearer {access_token}
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

#### PUT Update Job (Protected)
```
PUT /api/pekerjaan/{pekerjaan_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "nama_pekerjaan": "Senior Backend Developer",
  "bidang": "Technology"
}
```

**Status Code:** 200 OK

#### DELETE Job (Protected)
```
DELETE /api/pekerjaan/{pekerjaan_id}
Authorization: Bearer {access_token}
```

**Status Code:** 200 OK

---

### SKILLUP (Courses)

#### GET All Skills (dengan filter & pagination)
```
GET /api/skillup?page=1&limit=10
GET /api/skillup?level=intermediate&page=1&limit=10
```

#### GET Single Skill
```
GET /api/skillup/{skill_id}
```

#### POST Create Skill (Protected)
```
POST /api/skillup
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "nama_skillup": "Advanced Node.js",
  "link_skillup": "https://example.com/courses/nodejs",
  "deskripsi": "Learn advanced Node.js concepts",
  "level": "intermediate"
}
```

**Status Code:** 201 Created

#### PUT Update Skill (Protected)
```
PUT /api/skillup/{skill_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "nama_skillup": "Advanced Node.js & Express",
  "level": "advanced"
}
```

**Status Code:** 200 OK

#### DELETE Skill (Protected)
```
DELETE /api/skillup/{skill_id}
Authorization: Bearer {access_token}
```

**Status Code:** 200 OK

---

### PERSONALIZED

#### GET User Personalizations (Protected)
```
GET /api/users/{user_id}/personalized?page=1&limit=10
Authorization: Bearer {access_token}
```

#### GET Single Personalization (Protected)
```
GET /api/personalized/{rec_id}
Authorization: Bearer {access_token}
```

#### POST Create Personalization (Protected)
```
POST /api/personalized
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "role_fit": "Full Stack Developer",
  "strength": "Backend Development, Problem Solving",
  "skill_gap": "Frontend Development, DevOps",
  "level": "Junior",
  "gap": "2-3 years"
}
```

**Status Code:** 201 Created

#### PUT Update Personalization (Protected)
```
PUT /api/personalized/{rec_id}
Authorization: Bearer {access_token}
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

#### GET Job Recommendations for Personalization (Protected)
```
GET /api/personalized/{rec_id}/jobs?page=1&limit=10
Authorization: Bearer {access_token}
```

#### POST Add Job to Recommendations (Protected)
```
POST /api/rec-pekerjaan
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "rec_id": "ba6cc4b4-4525-42b9-9395-4d102760eca6",
  "pekerjaan_id": "e3e85f45-604e-44ac-9f67-502dc40bda31"
}
```

**Status Code:** 201 Created

#### DELETE Remove Job from Recommendations (Protected)
```
DELETE /api/rec-pekerjaan/{repekerjaan_id}
Authorization: Bearer {access_token}
```

**Status Code:** 200 OK

---

### REC SKILLUP (Skill Recommendations)

#### GET Skill Recommendations for Personalization (Protected)
```
GET /api/personalized/{rec_id}/skills?page=1&limit=10
Authorization: Bearer {access_token}
```

#### POST Add Skill to Recommendations (Protected)
```
POST /api/rec-skillup
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "rec_id": "ba6cc4b4-4525-42b9-9395-4d102760eca6",
  "skill_id": "4e56de2d-4bf0-47f6-a7a9-be4653c55030"
}
```

**Status Code:** 201 Created

#### DELETE Remove Skill from Recommendations (Protected)
```
DELETE /api/rec-skillup/{recskillup_id}
Authorization: Bearer {access_token}
```

**Status Code:** 200 OK

---

### COMPLETE PROFILE (Complex Query)

#### GET Complete User Profile with All Nested Data (Protected)
```
GET /api/profile/{user_id}
Authorization: Bearer {access_token}
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
      "created_at": "2025-10-24T..."
    },
    "personalizations": [
      {
        "rec_id": "ba6cc4b4-4525-42b9-9395-4d102760eca6",
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
| 401 | Unauthorized - Token tidak valid atau expired |
| 403 | Forbidden - Access denied (bukan owner data) |
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
  "timestamp": "2025-10-24T18:48:29.860Z"
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

## Authentication & Authorization

### Token-Based Authentication
Menggunakan JWT token dari Supabase Auth.

**How to Get Token:**
1. Register: POST /api/auth/register
2. Login: POST /api/auth/login
3. Get access_token dari response

**How to Use Token:**
```
Authorization: Bearer {access_token}
```

### Protected Routes
Routes dengan `(Protected)` memerlukan valid token:
- Personalized endpoints
- User update/delete
- Job/Skill create/update/delete
- Skill Questions create/update/delete
- Profile endpoints

### Authorization Rules
- Users hanya bisa akses/update data mereka sendiri
- Admin users bisa manage job & skill listings
- Skill Questions dapat di-read oleh public (untuk quiz)
- Public endpoints tidak butuh token

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

## Security

- Rate limiting: 100 requests per minute per IP (general), 5 requests per 15 minutes (auth)
- CORS enabled dengan configurable origin
- Helmet.js untuk security headers
- All input divalidasi sebelum database operation
- JWT token verification pada protected routes
- Password hashing via Supabase Auth

---

## Environment Setup

### .env
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Run Development
```bash
npm install
npm run dev
```

### Deploy to Production
Deployed at Railway: https://arunikabe-production.up.railway.app

---

## Tech Stack

- **Runtime:** Node.js v22.21.0
- **Framework:** Express.js v4.18.2
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth (JWT)
- **ORM/Client:** Supabase JS Client v2.39.8
- **Security:** Helmet.js v7.1.0, CORS v2.8.5, Rate Limiting v7.1.5
- **Dev Tools:** Nodemon v3.0.2, Dotenv v16.3.1

---

## Deployment Info

**Platform:** Railway
**URL Production:** https://arunikabe-production.up.railway.app
**Region:** Asia Southeast 1 (Singapore)
**Status:** Active & Running
**Last Deploy:** 2025-10-24 01:23:54 UTC

---

## Testing dengan Postman/VS Code REST Client

1. Import collection dari Postman workspace
2. Atau gunakan VS Code REST Client dengan file `requests.http`
3. Update base URL ke production URL atau localhost sesuai kebutuhan

**Example Testing Flow:**
1. POST /api/auth/register → get user_id & token
2. GET /api/skill-questions/categories → lihat semua role
3. GET /api/skill-questions?role_category=Backend%20Developer → ambil 12 soal backend
4. POST /api/personalized → create personalization dari quiz result
5. POST /api/pekerjaan → create/get job listings
6. POST /api/skillup → create/get skill courses
7. POST /api/rec-pekerjaan → link job ke personalization
8. POST /api/rec-skillup → link skill ke personalization
9. GET /api/profile/{user_id} → lihat semua nested data
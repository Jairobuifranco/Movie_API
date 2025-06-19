
# 🎬 Movie API

A RESTful movie database API built with Node.js, Express, and MySQL, featuring secure authentication, rich movie data, and Swagger documentation.

## 🌐 Live API
Base URL: [https://movie-api-4r5e.onrender.com](https://movie-api-4r5e.onrender.com)

---

## 🚀 Features

- 🔐 JWT authentication with refresh tokens
- 🧾 Register/Login with validation
- 👤 Profile management (view/update)
- 🎥 Movie search with flexible filters
- 🎭 Movie details including title, genre, rating, cast & crew
- 📚 Swagger API documentation

---

## 🛠️ Tech Stack

- Node.js + Express
- MySQL/MariaDB
- Knex.js
- JSON Web Tokens (JWT)
- Swagger UI

---

## ⚙️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/your-username/movie-api.git
cd movie-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Cab230!
DB_NAME=movies
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
TOKEN_EXPIRY=15m
REFRESH_EXPIRY=1d
```

### 4. Import the database

Use the included `dump.sql` file:
```bash
mysql -u root -p < dump.sql
```

### 5. Start the server

```bash
npm start
```

Server runs on: `http://localhost:3000`

---

## 🔑 Authentication Flow

1. `POST /user/register`  
2. `POST /user/login` – returns access and refresh tokens  
3. Use `Authorization: Bearer <token>` for protected endpoints  
4. `POST /user/token` to refresh access token  
5. `POST /user/logout` to invalidate refresh token

---

## 📘 API Documentation

Swagger UI available at:
```
http://localhost:3000/docs
```

---

## 🗂️ Project Structure

```
.
├── controllers/
├── middleware/
├── routes/
├── services/
├── db/
├── dump.sql
├── knexfile.js
├── server.js
└── README.md
```

---

## 🧪 Testing

You can use Postman or Swagger UI to interact with all routes. Protected routes require a valid JWT token in the `Authorization` header.

---

## 📄 License

MIT License – feel free to use and modify.

---

## 👨‍💻 Author

Jairo Buitrago – [GitHub](https://github.com/Jairobuifranco)

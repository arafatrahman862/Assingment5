# 🚗 Ride Booking System API

A secure, scalable, and role-based backend REST API for a ride booking platform (like Uber, Pathao) using Express.js, TypeScript, Mongoose, and JWT authentication.

## 📖 Table of Contents

- [🚀 Project Overview](#-project-overview)
- [⚙️ Technologies Used](#-technologies-used)
- [📦 Project Structure](#-project-structure)
- [🔐 Roles & Permissions](#-roles--permissions)
- [🛠️ Setup Instructions](#️-setup-instructions)
- [🧪 Environment Variables](#-environment-variables)
- [🔗 API Endpoints](#-api-endpoints)
- [📌 Future Enhancements](#-future-enhancements)

---

## 🚀 Project Overview

This API enables three types of users:
- **Riders**: Can request, cancel, and view ride history.
- **Drivers**: Can accept/reject rides, update ride statuses, manage availability, and view earnings.
- **Admins**: Can manage users, approve/suspend/reject drivers, and view all rides.

Supports:
- JWT-based authentication
- Secure password hashing
- Role-based authorization
- Zod input validation
- Modular codebase
- Clean error handling & response wrapping

---

## ⚙️ Technologies Used

- Node.js / Express.js
- TypeScript
- MongoDB + Mongoose
- JWT + Bcrypt
- Zod for schema validation
- Dotenv for env configs
- ESLint & Prettier for code quality

---


---

## 🔐 Roles & Permissions

| Role     | Permissions                                                                 |
|----------|-----------------------------------------------------------------------------|
| Rider    | Request/Cancel Ride, View History                                           |
| Driver   | Accept/Reject Ride, Update Status, View Earnings, Set Availability          |
| Admin    | Manage Users/Drivers, View Rides, Approve/Suspend/Reject Drivers            |

---




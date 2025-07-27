# 📚 StudyNotion Backend

StudyNotion is a full-stack EdTech platform where instructors can create and manage courses, and students can browse, purchase, and learn from them. This repository contains the **backend code** for the platform, built with **Node.js**, **Express.js**, and **MongoDB**.

---

## 🚀 Features

- 🔐 **Authentication & Authorization**
  - JWT-based login & signup for students and instructors
  - Role-based access control (admin/instructor/student)

- 🎓 **Course Management**
  - Instructors can create, update, delete courses
  - Add sections and subsections (video lectures) to courses
  - Upload thumbnails and videos via Cloudinary

- 💳 **Payment Integration**
  - Secure checkout using **Razorpay**
  - Course purchase flow with invoice generation

- 🛒 **Shopping Cart**
  - Add/remove courses to/from cart
  - Purchase single or multiple courses

- 📝 **Ratings & Reviews**
  - Students can rate and review purchased courses
  - Avg rating calculation & real-time update

- 📈 **Progress Tracking**
  - Track watched subsections
  - Show overall course progress

- 📧 **Email Notifications**
  - Send OTP on registration
  - Password reset flow

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT, Bcrypt
- **Payments:** Razorpay
- **Media Storage:** Cloudinary
- **Email Service:** NodeMailer
- **Environment Config:** dotenv

## ⚙️ Installation & Setup
Follow these steps to run the backend locally:

### 1. Clone the Repository

```bash
git clone https://github.com/amandeep-singh-parihar/edtech-backend.git
cd studynotion-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create .env File
```bash
MAIL_HOST=smtp.yourmailprovider.com
MAIL_USER=your-email@example.com
MAIL_PASS=your-mail-password
JWT_SCREAT=your_jwt_secret_key
FOLDER_NAME=studynotion-assets
RAZORPAY_KEY=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
PORT=5000
```

### 4. Start the Server
```bash
npm run dev
```
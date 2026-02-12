Healthcare Plus is a complete web application designed to bridge the gap between patients and healthcare providers. It features an intuitive frontend with custom cursor animations, real-time appointment booking, secure authentication, and a robust admin dashboard—all powered by a lightweight, file-based backend that requires no external database.

Features
For Patients
Effortless Appointment Booking – Schedule appointments across multiple departments

Real-time Health Tips – Daily wellness facts powered by dynamic content

Appointment Tracking – View and manage your appointment history

Secure Authentication – Register and login with encrypted credentials

Responsive Design – Seamless experience across desktop, tablet, and mobile

For Administrators
Comprehensive Dashboard – View all appointments with filtering and sorting

Status Management – Update appointment statuses (pending → confirmed → completed)

Patient Overview – Access complete appointment histories

Analytics Ready – Foundation for statistics and reporting

Email Notifications – Automated patient communications (configurable)

Technical Highlights
Zero Database Dependency – JSON file-based storage, no MongoDB required

Custom Cursor Animation – Engaging, accessibility-conscious UI effect

Modular Architecture – MVC pattern with separate route, controller, and model layers

Production Ready – Security headers, rate limiting, CORS configuration

Email Integration – Ethereal for development, SMTP for production

🛠️ Technology Stack
Frontend

HTML5, CSS3, Vanilla JavaScript

Responsive Flexbox/Grid layout

CSS animations and custom cursor effects

Backend

Node.js + Express.js

JWT authentication

bcrypt password hashing

File-based storage (JSON)

Nodemailer (email service)

Development

Nodemon for hot reloading

Environment configuration with dotenv

Express validator for input sanitization

 Getting Started
Prerequisites
Node.js (v14 or higher)

npm or yarn

Installation
Clone the repository


git clone https://github.com/Waithera006/healthcareplus.git
cd healthcare-plus
Install backend dependencies

cd backend
npm install
Configure environment variables

cp .env.example .env
# Edit .env with your preferred settings
Seed initial data

node seed.js
Start the server

npm run dev
Open the application

Frontend: Open public/index.html in your browser

API: http://localhost:5000/api

Default Credentials
Admin: admin@healthcareplus.com / Admin123

Patient: Register via the application

Performance Considerations
Scalability: File-based storage suitable for 10,000+ records; upgrade to MongoDB for enterprise scale

Security: JWT expiration, password hashing, rate limiting, Helmet.js headers

Accessibility: Custom cursor degrades gracefully, semantic HTML, ARIA labels

 Testing
 

# Run the test suite
npm test

# Manual API testing
curl http://localhost:5000/api/test

Deployment

Production Considerations
Set NODE_ENV=production in .env

Configure a real email service (SMTP/SendGrid)

Use a process manager like PM2

Implement MongoDB for persistent storage

Add SSL/TLS certificates

Deploy to services like Heroku, DigitalOcean, or AWS

 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request





// server.js - COMPLETE VERSION WITH ALL ENDPOINTS INCLUDING PROFILE MANAGEMENT AND EMAIL NOTIFICATIONS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Create data directory if it doesn't exist
const dataDir = process.env.DATA_DIR || './data';
if (!fsSync.existsSync(dataDir)) {
    fsSync.mkdirSync(dataDir, { recursive: true });
}

const app = express();

// CORS configuration - Allow all origins for development
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like file:// protocol)
        if (!origin) {
            return callback(null, true);
        }
        
        // Allow all origins in development
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://localhost:5000',
            'http://127.0.0.1:5000',
            'null'
        ];
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        callback(null, true); // Allow all in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin || 'null (file://)');
    next();
});

// Helper functions
function generateId() {
    return Math.random().toString(36).substr(2, 9) + 
           Date.now().toString(36).substr(4, 9);
}

async function readData(file) {
    try {
        const filePath = path.join(dataDir, file);
        // Check if file exists
        if (!fsSync.existsSync(filePath)) {
            return [];
        }
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
        return [];
    }
}

async function writeData(file, data) {
    try {
        await fs.writeFile(path.join(dataDir, file), JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${file}:`, error);
        return false;
    }
}

// ==================== EMAIL SERVICE ====================
let transporter;

// Initialize email transporter
async function initializeEmailTransporter() {
    try {
        if (process.env.NODE_ENV === 'production') {
            // Production email configuration
            if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT || 587,
                    secure: process.env.EMAIL_SECURE === 'true',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                console.log('📧 Production email transporter configured');
            }
        } else {
            // Development: Use Ethereal for testing
            if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
                // Use provided Ethereal credentials
                transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.ETHEREAL_USER,
                        pass: process.env.ETHEREAL_PASS
                    }
                });
                console.log(`📧 Using Ethereal email: ${process.env.ETHEREAL_USER}`);
            } else {
                // Generate test account automatically
                const testAccount = await nodemailer.createTestAccount();
                transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
                console.log('📧 Ethereal test account created automatically');
                console.log(`   Username: ${testAccount.user}`);
                console.log(`   Password: ${testAccount.pass}`);
                console.log('   Preview URL: https://ethereal.email/login');
            }
        }
    } catch (error) {
        console.error('❌ Failed to initialize email transporter:', error.message);
        console.log('   Email notifications will be logged to console only');
    }
}

// Email template functions
function getAppointmentPendingEmail(appointment, reference) {
    const date = new Date(appointment.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const time = new Date(appointment.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return {
        subject: `⏳ Appointment Request Received - Healthcare Plus (Ref: ${reference})`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #212529;
                        margin: 0;
                        padding: 0;
                        background-color: #f8f9fa;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #0D6986, #50A2B3);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 30px;
                    }
                    .badge {
                        display: inline-block;
                        padding: 8px 16px;
                        background: #fff3cd;
                        color: #856404;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .details {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #0D6986;
                    }
                    .detail-row {
                        display: flex;
                        margin-bottom: 10px;
                        border-bottom: 1px solid #e9ecef;
                        padding-bottom: 8px;
                    }
                    .detail-label {
                        font-weight: bold;
                        width: 120px;
                        color: #495057;
                    }
                    .detail-value {
                        flex: 1;
                        color: #212529;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #6c757d;
                        border-top: 1px solid #e9ecef;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Healthcare Plus</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">Compassionate Care for You and Your Family</p>
                    </div>
                    <div class="content">
                        <h2 style="color: #0D6986;">Appointment Request Received 📨</h2>
                        <p>Dear <strong>${appointment.patientName}</strong>,</p>
                        <p>Thank you for choosing Healthcare Plus. Your appointment request has been <span class="badge">RECEIVED</span> and is pending confirmation.</p>
                        
                        <div class="details">
                            <h3 style="color: #0D6986; margin-top: 0;">📋 Request Details</h3>
                            <div class="detail-row">
                                <span class="detail-label">Reference:</span>
                                <span class="detail-value"><strong>${reference}</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Department:</span>
                                <span class="detail-value">${appointment.department.charAt(0).toUpperCase() + appointment.department.slice(1)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${time}</span>
                            </div>
                            ${appointment.message ? `
                            <div class="detail-row">
                                <span class="detail-label">Message:</span>
                                <span class="detail-value">${appointment.message}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <p>Our team will review your request and contact you within <strong>24 hours</strong> to confirm your appointment time.</p>
                        <p>You can view the status of your appointment anytime by logging into your account.</p>
                    </div>
                    <div class="footer">
                        <p>🏥 Healthcare Plus Hospital</p>
                        <p>123 Healthcare City, HC 12345</p>
                        <p>Phone: (254) 123-456 | Email: info@healthcareplus.com</p>
                        <p>© ${new Date().getFullYear()} Healthcare Plus. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
}

function getAppointmentConfirmationEmail(appointment, reference) {
    const date = new Date(appointment.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const time = new Date(appointment.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return {
        subject: `✅ Appointment Confirmed - Healthcare Plus (Ref: ${reference})`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #212529;
                        margin: 0;
                        padding: 0;
                        background-color: #f8f9fa;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #4CAF50, #45a049);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 30px;
                    }
                    .badge {
                        display: inline-block;
                        padding: 8px 16px;
                        background: #d4edda;
                        color: #155724;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .details {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #4CAF50;
                    }
                    .detail-row {
                        display: flex;
                        margin-bottom: 10px;
                        border-bottom: 1px solid #e9ecef;
                        padding-bottom: 8px;
                    }
                    .detail-label {
                        font-weight: bold;
                        width: 120px;
                        color: #495057;
                    }
                    .detail-value {
                        flex: 1;
                        color: #212529;
                    }
                    .info-box {
                        background: #e8f4f8;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .emergency {
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background: #4CAF50;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                        font-weight: bold;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #6c757d;
                        border-top: 1px solid #e9ecef;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Healthcare Plus</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">Appointment Confirmed!</p>
                    </div>
                    <div class="content">
                        <h2 style="color: #4CAF50;">✅ Appointment Confirmed!</h2>
                        <p>Dear <strong>${appointment.patientName}</strong>,</p>
                        <p>Your appointment has been <span class="badge">CONFIRMED</span></p>
                        
                        <div class="details">
                            <h3 style="color: #4CAF50; margin-top: 0;">📋 Appointment Details</h3>
                            <div class="detail-row">
                                <span class="detail-label">Reference:</span>
                                <span class="detail-value"><strong>${reference}</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Department:</span>
                                <span class="detail-value">${appointment.department.charAt(0).toUpperCase() + appointment.department.slice(1)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${time}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value" style="color: #28a745; font-weight: bold;">Confirmed</span>
                            </div>
                            ${appointment.notes ? `
                            <div class="detail-row">
                                <span class="detail-label">Notes:</span>
                                <span class="detail-value">${appointment.notes}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="info-box">
                            <h4 style="color: #0D6986; margin-top: 0;">📌 Important Information</h4>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>Please arrive <strong>15 minutes</strong> before your scheduled time</li>
                                <li>Bring your ID and insurance card</li>
                                <li>Bring any relevant medical records or test results</li>
                                <li>If you need to reschedule, please call us at least 24 hours in advance</li>
                            </ul>
                        </div>
                        
                        <div class="emergency">
                            <strong style="color: #856404;">🚨 For emergencies:</strong>
                            <p style="margin: 5px 0 0; color: #856404;">Call ${process.env.EMERGENCY_PHONE || '(254) 123-456'} immediately</p>
                        </div>
                        
                        <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">Visit Our Website</a>
                    </div>
                    <div class="footer">
                        <p>🏥 Healthcare Plus Hospital</p>
                        <p>123 Healthcare City, HC 12345</p>
                        <p>Phone: ${process.env.CONTACT_PHONE || '(254) 123-456'} | Email: ${process.env.CONTACT_EMAIL || 'info@healthcareplus.com'}</p>
                        <p style="margin-top: 15px;">This is an automated message, please do not reply to this email.</p>
                        <p>© ${new Date().getFullYear()} Healthcare Plus. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
}

function getAppointmentCancellationEmail(appointment, reference, reason) {
    return {
        subject: `❌ Appointment Cancelled - Healthcare Plus (Ref: ${reference})`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #212529;
                        margin: 0;
                        padding: 0;
                        background-color: #f8f9fa;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #dc3545, #c82333);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .content {
                        padding: 30px;
                    }
                    .badge {
                        display: inline-block;
                        padding: 8px 16px;
                        background: #f8d7da;
                        color: #721c24;
                        border-radius: 20px;
                        font-weight: bold;
                    }
                    .details {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #dc3545;
                    }
                    .detail-row {
                        display: flex;
                        margin-bottom: 10px;
                        border-bottom: 1px solid #e9ecef;
                        padding-bottom: 8px;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #6c757d;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Healthcare Plus</h1>
                    </div>
                    <div class="content">
                        <h2 style="color: #dc3545;">❌ Appointment Cancelled</h2>
                        <p>Dear <strong>${appointment.patientName}</strong>,</p>
                        <p>Your appointment has been <span class="badge">CANCELLED</span></p>
                        
                        <div class="details">
                            <h3 style="color: #dc3545; margin-top: 0;">Cancellation Details</h3>
                            <div class="detail-row">
                                <span class="detail-label">Reference:</span>
                                <span class="detail-value">${reference}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Department:</span>
                                <span class="detail-value">${appointment.department}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Reason:</span>
                                <span class="detail-value">${reason || 'No reason provided'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Cancelled by:</span>
                                <span class="detail-value">${appointment.cancelledByName || 'System'}</span>
                            </div>
                        </div>
                        
                        <p>If you did not request this cancellation or if this is a mistake, please contact us immediately.</p>
                        <p>To book a new appointment, please visit our website or call us at ${process.env.CONTACT_PHONE || '(254) 123-456'}.</p>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="${process.env.APP_URL || 'http://localhost:5000'}" style="display: inline-block; padding: 10px 20px; background: #0D6986; color: white; text-decoration: none; border-radius: 5px;">Book New Appointment</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>🏥 Healthcare Plus Hospital</p>
                        <p>Phone: ${process.env.CONTACT_PHONE || '(254) 123-456'}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
}

async function sendEmail(to, subject, html) {
    if (!transporter) {
        console.log('\n📧 EMAIL NOTIFICATION (Transporter not ready)');
        console.log('   To:', to);
        console.log('   Subject:', subject);
        console.log('   Preview would be available in production\n');
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"Healthcare Plus" <${process.env.ETHEREAL_USER || 'noreply@healthcareplus.com'}>`,
            to,
            subject,
            html
        });

        console.log('\n✅ Email sent successfully!');
        console.log('   To:', to);
        console.log('   Subject:', subject);
        
        // If using Ethereal, log the preview URL
        if (info.messageId && nodemailer.getTestMessageUrl) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('   📧 Preview URL:', previewUrl);
            }
        }
        console.log('');
        
        return true;
    } catch (error) {
        console.error('\n❌ Failed to send email:', error.message);
        return false;
    }
}

// ==================== MIDDLEWARE ====================
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
        );
        
        const users = await readData('users.json');
        const user = users.find(u => u.id === decoded.id && u.isActive !== false);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            createdAt: user.createdAt
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Admin check middleware
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Initialize data if files don't exist
async function initializeData() {
    const files = ['users.json', 'appointments.json', 'healthtips.json'];
    
    for (const file of files) {
        const filePath = path.join(dataDir, file);
        if (!fsSync.existsSync(filePath)) {
            if (file === 'healthtips.json') {
                const tips = [
                    { 
                        id: generateId(), 
                        tip: "An apple a day keeps the doctor away - they're packed with fiber and antioxidants!",
                        category: "nutrition",
                        source: "Healthcare Plus Medical Team",
                        isActive: true,
                        views: 0
                    },
                    { 
                        id: generateId(), 
                        tip: "Bananas are rich in potassium, vital for heart health and muscle function.",
                        category: "nutrition",
                        source: "Healthcare Plus Medical Team",
                        isActive: true,
                        views: 0
                    },
                    { 
                        id: generateId(), 
                        tip: "Drinking 8 glasses of water daily helps maintain proper body function.",
                        category: "general",
                        source: "Healthcare Plus Medical Team",
                        isActive: true,
                        views: 0
                    }
                ];
                await writeData(file, tips);
                console.log(`✅ Created ${file} with sample health tips`);
            } else {
                await writeData(file, []);
                console.log(`✅ Created empty ${file}`);
            }
        }
    }
}

// ==================== TEST ENDPOINTS ====================
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test-cors', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working!',
        origin: req.headers.origin || 'null',
        timestamp: new Date().toISOString()
    });
});

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
    try {
        const testAppointment = {
            patientName: "Test Patient",
            patientEmail: req.query.email || (transporter ? transporter.options.auth.user : 'test@example.com'),
            department: "cardiology",
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        
        const reference = `TEST${testAppointment.id.slice(-6).toUpperCase()}`;
        const emailTemplate = getAppointmentConfirmationEmail(testAppointment, reference);
        
        const result = await sendEmail(
            testAppointment.patientEmail,
            emailTemplate.subject,
            emailTemplate.html
        );
        
        res.json({
            success: true,
            message: 'Test email sent!',
            previewUrl: result ? (nodemailer.getTestMessageUrl && result.previewUrl) : 'Check console for preview',
            to: testAppointment.patientEmail
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== HEALTH TIPS ROUTES ====================
app.get('/api/healthtips/random', async (req, res) => {
    try {
        const tips = await readData('healthtips.json');
        const activeTips = tips.filter(tip => tip.isActive !== false);
        
        if (activeTips.length === 0) {
            return res.json({
                success: true,
                tip: {
                    id: 'fallback',
                    content: "Stay healthy and drink plenty of water!",
                    category: "general",
                    source: "Healthcare Plus"
                }
            });
        }
        
        const randomTip = activeTips[Math.floor(Math.random() * activeTips.length)];
        
        // Update view count
        randomTip.views = (randomTip.views || 0) + 1;
        await writeData('healthtips.json', tips);
        
        res.json({
            success: true,
            tip: {
                id: randomTip.id,
                content: randomTip.tip,
                category: randomTip.category,
                source: randomTip.source
            }
        });
    } catch (error) {
        console.error('Error getting health tip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get health tip'
        });
    }
});

// Get all health tips (admin only)
app.get('/api/healthtips', verifyToken, isAdmin, async (req, res) => {
    try {
        const tips = await readData('healthtips.json');
        res.json({
            success: true,
            count: tips.length,
            tips: tips
        });
    } catch (error) {
        console.error('Error getting health tips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get health tips'
        });
    }
});

// ==================== AUTHENTICATION ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }
        
        const users = await readData('users.json');
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = {
            id: generateId(),
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'patient',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        await writeData('users.json', users);
        
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        const users = await readData('users.json');
        const user = users.find(u => u.email === email && u.isActive !== false);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
            { expiresIn: '7d' }
        );
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        user.updatedAt = new Date().toISOString();
        await writeData('users.json', users);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// ==================== PROFILE MANAGEMENT ROUTES ====================

// Change Password
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }
        
        // Check password strength
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecial) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain uppercase, lowercase, number, and special character'
            });
        }
        
        const users = await readData('users.json');
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[userIndex];
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        users[userIndex].password = hashedPassword;
        users[userIndex].updatedAt = new Date().toISOString();
        users[userIndex].passwordChangedAt = new Date().toISOString();
        
        await writeData('users.json', users);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// Change Email (Admin only)
app.post('/api/auth/change-email', verifyToken, isAdmin, async (req, res) => {
    try {
        const { newEmail, password } = req.body;
        
        if (!newEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide new email and password'
            });
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        const users = await readData('users.json');
        
        // Check if email already exists
        if (users.find(u => u.email === newEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
        
        const userIndex = users.findIndex(u => u.id === req.user.id);
        const user = users[userIndex];
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }
        
        // Store old email for record
        const oldEmail = user.email;
        
        users[userIndex].email = newEmail;
        users[userIndex].updatedAt = new Date().toISOString();
        users[userIndex].emailChangedAt = new Date().toISOString();
        users[userIndex].oldEmail = oldEmail;
        
        await writeData('users.json', users);
        
        res.json({
            success: true,
            message: 'Email changed successfully',
            oldEmail: oldEmail,
            newEmail: newEmail
        });
    } catch (error) {
        console.error('Error changing email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change email'
        });
    }
});

// Delete Account
app.delete('/api/auth/delete-account', verifyToken, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your password'
            });
        }
        
        const users = await readData('users.json');
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[userIndex];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }
        
        // Don't allow deletion of last admin
        if (user.role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin' && u.isActive !== false).length;
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last admin account'
                });
            }
        }
        
        // Instead of deleting, mark as inactive (soft delete)
        if (process.env.NODE_ENV === 'production') {
            users[userIndex].isActive = false;
            users[userIndex].deletedAt = new Date().toISOString();
            users[userIndex].email = `deleted_${user.id}_${user.email}`;
            await writeData('users.json', users);
        } else {
            // Hard delete for development
            users.splice(userIndex, 1);
            await writeData('users.json', users);
        }
        
        // Remove user's appointments or mark them as deleted
        const appointments = await readData('appointments.json');
        const updatedAppointments = appointments.map(appt => {
            if (appt.userId === req.user.id || appt.patientEmail === req.user.email) {
                return {
                    ...appt,
                    status: 'cancelled',
                    patientName: '[Account Deleted]',
                    patientEmail: `deleted_${appt.patientEmail}`,
                    patientPhone: '[Deleted]',
                    updatedAt: new Date().toISOString(),
                    deleted: true
                };
            }
            return appt;
        });
        
        await writeData('appointments.json', updatedAppointments);
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
});

// Update Profile (Name, Phone)
app.put('/api/auth/update-profile', verifyToken, async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        const users = await readData('users.json');
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (name) users[userIndex].name = name;
        if (phone) users[userIndex].phone = phone;
        
        users[userIndex].updatedAt = new Date().toISOString();
        
        await writeData('users.json', users);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: users[userIndex].id,
                name: users[userIndex].name,
                email: users[userIndex].email,
                phone: users[userIndex].phone,
                role: users[userIndex].role
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Get Login History (Admin only)
app.get('/api/auth/login-history/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const users = await readData('users.json');
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            loginHistory: {
                lastLogin: user.lastLogin || 'Never',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                passwordChangedAt: user.passwordChangedAt || null,
                emailChangedAt: user.emailChangedAt || null
            }
        });
    } catch (error) {
        console.error('Error getting login history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get login history'
        });
    }
});

// ==================== APPOINTMENT ROUTES ====================

// Book new appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const { patientName, patientEmail, patientPhone, department, message } = req.body;
        
        // Validate required fields
        if (!patientName || !patientEmail || !patientPhone || !department) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }
        
        const appointments = await readData('appointments.json');
        const newAppointment = {
            id: generateId(),
            patientName,
            patientEmail,
            patientPhone,
            department,
            message: message || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: req.user ? req.user.id : null
        };
        
        appointments.push(newAppointment);
        await writeData('appointments.json', appointments);
        
        const reference = `APPT${newAppointment.id.slice(-6).toUpperCase()}`;
        
        // Send confirmation email
        const emailTemplate = getAppointmentPendingEmail(newAppointment, reference);
        sendEmail(patientEmail, emailTemplate.subject, emailTemplate.html);
        
        res.status(201).json({
            success: true,
            message: 'Appointment request submitted successfully! We will contact you shortly.',
            appointment: {
                id: newAppointment.id,
                patientName: newAppointment.patientName,
                department: newAppointment.department,
                status: newAppointment.status,
                reference
            }
        });
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to book appointment'
        });
    }
});

// Get user's appointments (authenticated)
app.get('/api/appointments/my', verifyToken, async (req, res) => {
    try {
        const appointments = await readData('appointments.json');
        const userAppointments = appointments.filter(appt => 
            appt.patientEmail === req.user.email || appt.userId === req.user.id
        );
        
        // Sort by creation date (newest first)
        userAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            success: true,
            count: userAppointments.length,
            appointments: userAppointments
        });
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get appointments'
        });
    }
});

// Get all appointments (admin only)
app.get('/api/appointments', verifyToken, isAdmin, async (req, res) => {
    try {
        const appointments = await readData('appointments.json');
        
        // Sort by creation date (newest first)
        appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            success: true,
            count: appointments.length,
            appointments: appointments
        });
    } catch (error) {
        console.error('Error getting all appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get appointments'
        });
    }
});

// Get single appointment
app.get('/api/appointments/:id', verifyToken, async (req, res) => {
    try {
        const appointments = await readData('appointments.json');
        const appointment = appointments.find(appt => appt.id === req.params.id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        // Check permission
        const isAdmin = req.user.role === 'admin';
        const isOwner = appointment.patientEmail === req.user.email || appointment.userId === req.user.id;
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this appointment'
            });
        }
        
        res.json({
            success: true,
            appointment: appointment
        });
    } catch (error) {
        console.error('Error getting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get appointment'
        });
    }
});

// UPDATE APPOINTMENT STATUS (ADMIN ONLY) - WITH EMAIL NOTIFICATION
app.put('/api/appointments/:id/status', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: pending, confirmed, cancelled, or completed'
            });
        }
        
        const appointments = await readData('appointments.json');
        const appointmentIndex = appointments.findIndex(appt => appt.id === req.params.id);
        
        if (appointmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        const oldStatus = appointments[appointmentIndex].status;
        
        // Update appointment
        appointments[appointmentIndex] = {
            ...appointments[appointmentIndex],
            status: status,
            notes: notes || appointments[appointmentIndex].notes,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id,
            updatedByName: req.user.name
        };
        
        await writeData('appointments.json', appointments);
        
        const updatedAppointment = appointments[appointmentIndex];
        const reference = `APPT${updatedAppointment.id.slice(-6).toUpperCase()}`;
        
        // Send email notification based on status change
        if (status === 'confirmed' && oldStatus !== 'confirmed') {
            const emailTemplate = getAppointmentConfirmationEmail(updatedAppointment, reference);
            sendEmail(updatedAppointment.patientEmail, emailTemplate.subject, emailTemplate.html);
        } else if (status === 'cancelled' && oldStatus !== 'cancelled') {
            const emailTemplate = getAppointmentCancellationEmail(updatedAppointment, reference, notes || 'Cancelled by administrator');
            sendEmail(updatedAppointment.patientEmail, emailTemplate.subject, emailTemplate.html);
        }
        
        res.json({
            success: true,
            message: `Appointment status updated to ${status}`,
            appointment: appointments[appointmentIndex]
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment status'
        });
    }
});

// Cancel appointment (user or admin) - WITH EMAIL NOTIFICATION
app.put('/api/appointments/:id/cancel', verifyToken, async (req, res) => {
    try {
        const appointments = await readData('appointments.json');
        const appointmentIndex = appointments.findIndex(appt => appt.id === req.params.id);
        
        if (appointmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        const appointment = appointments[appointmentIndex];
        const isAdmin = req.user.role === 'admin';
        const isOwner = appointment.patientEmail === req.user.email || appointment.userId === req.user.id;
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this appointment'
            });
        }
        
        appointments[appointmentIndex] = {
            ...appointment,
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
            cancelledBy: req.user.id,
            cancelledByName: req.user.name,
            cancellationReason: req.body.reason || 'Cancelled by ' + (isAdmin ? 'admin' : 'patient')
        };
        
        await writeData('appointments.json', appointments);
        
        const cancelledAppointment = appointments[appointmentIndex];
        const reference = `APPT${cancelledAppointment.id.slice(-6).toUpperCase()}`;
        
        // Send cancellation email
        const emailTemplate = getAppointmentCancellationEmail(
            cancelledAppointment, 
            reference, 
            cancelledAppointment.cancellationReason
        );
        sendEmail(cancelledAppointment.patientEmail, emailTemplate.subject, emailTemplate.html);
        
        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            appointment: appointments[appointmentIndex]
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel appointment'
        });
    }
});

// GET APPOINTMENT STATISTICS (ADMIN ONLY)
app.get('/api/appointments/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const appointments = await readData('appointments.json');
        const users = await readData('users.json');
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get this week's start
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        // Get this month's start
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const stats = {
            total: {
                appointments: appointments.length,
                patients: users.filter(u => u.role === 'patient' && u.isActive !== false).length,
                doctors: users.filter(u => u.role === 'doctor').length,
                admins: users.filter(u => u.role === 'admin').length
            },
            today: {
                appointments: appointments.filter(appt => {
                    const apptDate = new Date(appt.createdAt);
                    apptDate.setHours(0, 0, 0, 0);
                    return apptDate.getTime() === today.getTime();
                }).length,
                pending: appointments.filter(appt => {
                    const apptDate = new Date(appt.createdAt);
                    apptDate.setHours(0, 0, 0, 0);
                    return apptDate.getTime() === today.getTime() && appt.status === 'pending';
                }).length
            },
            byStatus: {
                pending: appointments.filter(a => a.status === 'pending').length,
                confirmed: appointments.filter(a => a.status === 'confirmed').length,
                cancelled: appointments.filter(a => a.status === 'cancelled').length,
                completed: appointments.filter(a => a.status === 'completed').length
            },
            byDepartment: {},
            recent: appointments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
        };
        
        // Count by department
        appointments.forEach(appt => {
            stats.byDepartment[appt.department] = (stats.byDepartment[appt.department] || 0) + 1;
        });
        
        // Weekly stats
        stats.weekly = {
            appointments: appointments.filter(appt => new Date(appt.createdAt) >= weekStart).length,
            byDay: {}
        };
        
        // Monthly stats
        stats.monthly = {
            appointments: appointments.filter(appt => new Date(appt.createdAt) >= monthStart).length,
            byWeek: {}
        };
        
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error getting appointment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get appointment statistics'
        });
    }
});

// DELETE APPOINTMENT (ADMIN ONLY)
app.delete('/api/appointments/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const appointments = await readData('appointments.json');
        const filteredAppointments = appointments.filter(appt => appt.id !== req.params.id);
        
        if (filteredAppointments.length === appointments.length) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        
        await writeData('appointments.json', filteredAppointments);
        
        res.json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete appointment'
        });
    }
});

// ==================== USER MANAGEMENT ROUTES (ADMIN) ====================
app.get('/api/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await readData('users.json');
        // Remove passwords from response
        const safeUsers = users.map(({ password, ...user }) => ({
            ...user,
            isActive: user.isActive !== false
        }));
        
        res.json({
            success: true,
            count: safeUsers.length,
            users: safeUsers
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
});

// Get single user (admin only)
app.get('/api/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await readData('users.json');
        const user = users.find(u => u.id === req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Remove password
        const { password, ...safeUser } = user;
        
        res.json({
            success: true,
            user: safeUser
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user'
        });
    }
});

// ==================== STATIC FILES ====================
// Serve static files from public directory - BEFORE the catch-all route
app.use(express.static(path.join(__dirname, 'public')));

// IMPORTANT: API routes must be defined before this catch-all route
// This catch-all route serves the frontend for non-API routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes (should have been caught already)
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const PORT = process.env.PORT || 5000;

// Initialize everything and start server
async function startServer() {
    await initializeData();
    await initializeEmailTransporter();
    
    app.listen(PORT, () => {
        console.log('\n' + '='.repeat(60));
        console.log(`✅ SERVER RUNNING ON http://localhost:${PORT}`);
        console.log('='.repeat(60));
        console.log(`📁 Data directory: ${dataDir}`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📧 Email: ${transporter ? 'Configured' : 'Disabled (logs only)'}`);
        console.log('\n📡 AVAILABLE ENDPOINTS:');
        console.log('   🔧 TEST:');
        console.log('   ├─ GET  /api/test - Test API');
        console.log('   ├─ GET  /api/test-cors - Test CORS');
        console.log('   └─ GET  /api/test-email - Test email (add ?email=you@example.com)');
        console.log('\n   💡 HEALTH TIPS:');
        console.log('   ├─ GET  /api/healthtips/random - Get random health tip');
        console.log('   └─ GET  /api/healthtips - Get all tips (admin)');
        console.log('\n   🔐 AUTH:');
        console.log('   ├─ POST /api/auth/register - Register user');
        console.log('   ├─ POST /api/auth/login - Login user');
        console.log('   ├─ GET  /api/auth/me - Get current user');
        console.log('   ├─ POST /api/auth/change-password - Change password');
        console.log('   ├─ POST /api/auth/change-email - Change email (admin)');
        console.log('   ├─ PUT  /api/auth/update-profile - Update profile');
        console.log('   ├─ DELETE /api/auth/delete-account - Delete account');
        console.log('   └─ GET  /api/auth/login-history/:userId - Get login history (admin)');
        console.log('\n   📅 APPOINTMENTS:');
        console.log('   ├─ POST /api/appointments - Book appointment (sends email)');
        console.log('   ├─ GET  /api/appointments/my - Get my appointments');
        console.log('   ├─ GET  /api/appointments - Get all appointments (admin)');
        console.log('   ├─ GET  /api/appointments/:id - Get appointment by ID');
        console.log('   ├─ PUT  /api/appointments/:id/status - Update status (admin) (sends email)');
        console.log('   ├─ PUT  /api/appointments/:id/cancel - Cancel appointment (sends email)');
        console.log('   ├─ GET  /api/appointments/stats - Get statistics (admin)');
        console.log('   └─ DELETE /api/appointments/:id - Delete appointment (admin)');
        console.log('\n   👥 USERS:');
        console.log('   ├─ GET  /api/users - Get all users (admin)');
        console.log('   └─ GET  /api/users/:id - Get single user (admin)');
        console.log('\n📝 TEST CREDENTIALS:');
        console.log('   ├─ Admin: admin@healthcareplus.com / Admin123');
        console.log('   └─ Patient: (register new patient)');
        console.log('='.repeat(60) + '\n');
    });
}

startServer();                
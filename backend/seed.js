// seed.js - Simplified version
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = process.env.DATA_DIR || './data';

// Simple ID generator
function generateId() {
    return Math.random().toString(36).substr(2, 9) + 
           Date.now().toString(36).substr(4, 9);
}

async function seedDatabase() {
    try {
        console.log('Seeding database...');
        
        // Create data directory if it doesn't exist
        if (!require('fs').existsSync(dataDir)) {
            require('fs').mkdirSync(dataDir, { recursive: true });
        }
        
        // Seed health tips
        const healthTips = [
            {
                id: generateId(),
                tip: "An apple a day keeps the doctor away - they're packed with fiber and antioxidants!",
                category: "nutrition",
                tags: ["fruits", "antioxidants", "fiber"],
                source: "Healthcare Plus Medical Team",
                isActive: true,
                views: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                tip: "Bananas are rich in potassium, vital for heart health and muscle function.",
                category: "nutrition",
                tags: ["potassium", "heart health", "muscles"],
                source: "Healthcare Plus Medical Team",
                isActive: true,
                views: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                tip: "Drinking 8 glasses of water daily helps maintain proper body function.",
                category: "general",
                tags: ["hydration", "water", "wellness"],
                source: "Healthcare Plus Medical Team",
                isActive: true,
                views: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                tip: "Regular exercise for 30 minutes a day can reduce the risk of chronic diseases.",
                category: "exercise",
                tags: ["exercise", "prevention", "fitness"],
                source: "Healthcare Plus Medical Team",
                isActive: true,
                views: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                tip: "Getting 7-9 hours of sleep each night is essential for physical and mental health.",
                category: "mental-health",
                tags: ["sleep", "mental health", "rest"],
                source: "Healthcare Plus Medical Team",
                isActive: true,
                views: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        // Seed admin user
        const hashedPassword = await bcrypt.hash('Admin123', 12);
        const users = [
            {
                id: generateId(),
                name: "Admin User",
                email: "admin@healthcareplus.com",
                phone: "+254700000000",
                password: hashedPassword,
                role: "admin",
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: null
            }
        ];
        
        // Seed appointments (empty array)
        const appointments = [];
        
        // Write to files
        await fs.writeFile(
            path.join(dataDir, 'healthtips.json'),
            JSON.stringify(healthTips, null, 2)
        );
        
        await fs.writeFile(
            path.join(dataDir, 'users.json'),
            JSON.stringify(users, null, 2)
        );
        
        await fs.writeFile(
            path.join(dataDir, 'appointments.json'),
            JSON.stringify(appointments, null, 2)
        );
        
        console.log('✅ Database seeded successfully!');
        console.log(`📁 Data stored in: ${dataDir}`);
        console.log('👤 Admin credentials:');
        console.log('   Email: admin@healthcareplus.com');
        console.log('   Password: Admin123');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
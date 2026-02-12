const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const dataDir = process.env.DATA_DIR || './data';

// Simple ID generator
function generateId() {
    return Math.random().toString(36).substr(2, 9) + 
           Date.now().toString(36).substr(4, 9);
}

// Ensure data directory and files exist
async function initializeFileSystem() {
    const files = ['users.json', 'appointments.json', 'healthtips.json'];
    
    for (const file of files) {
        const filePath = path.join(dataDir, file);
        if (!fsSync.existsSync(filePath)) {
            await fs.writeFile(filePath, JSON.stringify([], null, 2));
        }
    }
}

// Read from JSON file
async function readFile(filename) {
    try {
        const filePath = path.join(dataDir, filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
}

// Write to JSON file
async function writeFile(filename, data) {
    try {
        const filePath = path.join(dataDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
}

// CRUD operations for different collections
async function getAll(collection) {
    return await readFile(`${collection}.json`);
}

async function getById(collection, id) {
    const items = await readFile(`${collection}.json`);
    return items.find(item => item.id === id);
}

async function getByField(collection, field, value) {
    const items = await readFile(`${collection}.json`);
    return items.find(item => item[field] === value);
}

async function create(collection, data) {
    const items = await readFile(`${collection}.json`);
    const newItem = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
    };
    items.push(newItem);
    await writeFile(`${collection}.json`, items);
    return newItem;
}

async function update(collection, id, data) {
    const items = await readFile(`${collection}.json`);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString()
    };
    
    await writeFile(`${collection}.json`, items);
    return items[index];
}

async function remove(collection, id) {
    const items = await readFile(`${collection}.json`);
    const filteredItems = items.filter(item => item.id !== id);
    await writeFile(`${collection}.json`, filteredItems);
    return true;
}

// Initialize on startup
initializeFileSystem();

module.exports = {
    getAll,
    getById,
    getByField,
    create,
    update,
    remove,
    readFile,
    writeFile
};
/**
 * Insert test notifications for a user (NavBar / unread count).
 * Usage: node create-test-notifications.js [optionalUserObjectId]
 * Uses MONGODB_URI from backend/.env
 */
const mongoose = require('mongoose');
const Notification = require('./models/Notification.model');
require('dotenv').config();

const DEFAULT_USER_ID = '69d265123b56887aba0b8c0e';

async function createTestNotifications() {
    const userId = process.argv[2] || process.env.TEST_NOTIFY_USER_ID || DEFAULT_USER_ID;

    if (!mongoose.isValidObjectId(userId)) {
        console.error('Invalid user ObjectId:', userId);
        process.exit(1);
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const notifications = [
            {
                user: userId,
                title: 'NavBar test – Hello Abdelrahman',
                message:
                    'If you see this in the bell dropdown, notifications are loading correctly. Click to mark read or use View all.',
                type: 'system',
                isRead: false,
                priority: 'medium',
                link: '/dashboard'
            },
            {
                user: userId,
                title: 'Case update (sample)',
                message: 'Second unread item so the badge can show "2" on the bell.',
                type: 'case',
                isRead: false,
                priority: 'high'
            }
        ];

        const result = await Notification.insertMany(notifications);
        console.log(`Created ${result.length} unread notification(s) for user ${userId}`);
        result.forEach((n) => console.log('  -', n._id.toString(), n.title));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createTestNotifications();

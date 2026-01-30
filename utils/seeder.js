import UserRepository from '../repositories/UserRepository.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDeveloper = async () => {
    try {
        const existingDev = await UserRepository.findOne({ role: 'developer' });

        if (!existingDev) {
            console.log('No developer found. Creating default developer account...');

            const devData = {
                name: 'Anand Mohan',
                email: 'nandu797090@gmail.com',
                password: 'password123', // Admin/Dev should change this immediately
                role: 'developer'
            };

            await UserRepository.create(devData);
            console.log('Default Developer Account Created: nandu797090@gmail.com / password123');
        } else {
            console.log('Developer account already exists.');
        }
    } catch (error) {
        console.error('Seeding failed:', error.message);
    }
};

export default seedDeveloper;

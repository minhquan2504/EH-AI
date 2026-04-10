import admin from 'firebase-admin';

const getServiceAccount = () => {
    try {
        const config = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!config) {
            throw new Error("Missing FIREBASE_SERVICE_ACCOUNT in .env file");
        }
        return JSON.parse(config);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Firebase Auth Error:", error.message);
        } else {
            console.error("Firebase Auth Error:", error);
        }
        process.exit(1);
    }
};

const serviceAccount = getServiceAccount();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const fcmAdmin = admin;
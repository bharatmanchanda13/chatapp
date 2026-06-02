import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    onModuleInit() {
        if (admin.apps.length) return;

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
                    /\\n/g,
                    '\n',
                ),
            }),
        });
    }

    async sendToTokens(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, string>,
    ) {
    if (!tokens.length) return;
        return admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title,
                body,
            },
            data,
        });
    }
}


import Stripe from 'stripe';
import { Clerk } from '@clerk/clerk-sdk-node';

export class PaymentService {
    private stripe: Stripe;
    private clerk: ReturnType<typeof Clerk>;

    constructor(stripeKey: string, clerkKey: string) {
        this.stripe = new Stripe(stripeKey, {
            apiVersion: '2025-12-15.clover' as any, // Cast to any to avoid strict type checking issues if types don't match exactly yet
        });
        this.clerk = Clerk({ secretKey: clerkKey });
    }

    public async createCheckoutSession(userId: string, email: string, returnUrl: string): Promise<string> {
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            // payment_method_types: ['card'], // Removed to allow Dashboard settings to control this (Avoids 403 on some new accounts)
            customer_email: email,
            metadata: {
                userId: userId
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Enterprise AI Pro Plan',
                            description: 'Access to Sandbox and Unlimited Projects'
                        },
                        unit_amount: 2900, // $29.00
                        recurring: {
                            interval: 'month'
                        }
                    },
                    quantity: 1,
                },
            ],
            success_url: `${returnUrl}?success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
        });

        return session.url || '';
    }

    public async handleWebhook(signature: string, payload: Buffer, endpointSecret: string): Promise<void> {
        let event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed.`, err.message);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;

            if (userId) {
                console.log(`[Payment] Upgrading user ${userId} to PRO`);
                await this.clerk.users.updateUser(userId, {
                    publicMetadata: {
                        tier: 'pro'
                    }
                });
            }
        }
    }
}

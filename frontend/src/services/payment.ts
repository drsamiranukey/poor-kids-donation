import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import apiService from './api';

class PaymentService {
  private stripe: Stripe | null = null;
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    this.stripePromise = loadStripe(
      process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_key_here'
    );
  }

  async getStripe(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await this.stripePromise;
    }
    return this.stripe;
  }

  async createPaymentIntent(amount: number, currency: string = 'USD') {
    try {
      const response = await apiService.createPaymentIntent(amount, currency);
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmCardPayment(
    clientSecret: string,
    elements: StripeElements,
    cardElement: any,
    billingDetails: {
      name: string;
      email: string;
      address?: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    }
  ) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe not loaded');
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: billingDetails,
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  }

  async processPayPalPayment(amount: number, currency: string = 'USD') {
    // PayPal integration would go here
    // For now, we'll simulate a PayPal payment
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate success/failure
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          resolve({
            id: `paypal_${Date.now()}`,
            status: 'completed',
            amount,
            currency,
            payer: {
              email: 'donor@example.com',
              name: 'PayPal Donor'
            }
          });
        } else {
          reject(new Error('PayPal payment failed'));
        }
      }, 2000);
    });
  }

  async processBankTransfer(
    amount: number,
    currency: string = 'USD',
    bankDetails: {
      accountNumber: string;
      routingNumber: string;
      accountHolderName: string;
    }
  ) {
    // Bank transfer processing would go here
    // This is typically handled by services like Plaid or direct bank APIs
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% success rate
        if (success) {
          resolve({
            id: `bank_${Date.now()}`,
            status: 'pending', // Bank transfers usually take time to process
            amount,
            currency,
            bankDetails: {
              ...bankDetails,
              accountNumber: `****${bankDetails.accountNumber.slice(-4)}` // Mask account number
            }
          });
        } else {
          reject(new Error('Bank transfer failed'));
        }
      }, 3000);
    });
  }

  async setupRecurringPayment(
    paymentMethodId: string,
    amount: number,
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    currency: string = 'USD'
  ) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe not loaded');
    }

    try {
      // Create a subscription or setup intent for recurring payments
      const response = await apiService.api.post('/payments/setup-recurring', {
        paymentMethodId,
        amount,
        frequency,
        currency
      });

      return response.data;
    } catch (error) {
      console.error('Error setting up recurring payment:', error);
      throw new Error('Failed to setup recurring payment');
    }
  }

  async cancelRecurringPayment(subscriptionId: string) {
    try {
      const response = await apiService.api.post(`/payments/cancel-recurring/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling recurring payment:', error);
      throw new Error('Failed to cancel recurring payment');
    }
  }

  async getPaymentMethods(customerId: string) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe not loaded');
    }

    try {
      const response = await apiService.api.get(`/payments/methods/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new Error('Failed to fetch payment methods');
    }
  }

  async savePaymentMethod(paymentMethodId: string, customerId: string) {
    try {
      const response = await apiService.api.post('/payments/save-method', {
        paymentMethodId,
        customerId
      });
      return response.data;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw new Error('Failed to save payment method');
    }
  }

  async deletePaymentMethod(paymentMethodId: string) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe not loaded');
    }

    try {
      const result = await stripe.paymentMethods.detach(paymentMethodId);
      return result;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw new Error('Failed to delete payment method');
    }
  }

  // Utility methods
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  }

  validateAmount(amount: number, currency: string = 'USD'): boolean {
    // Minimum amounts vary by currency
    const minimums: { [key: string]: number } = {
      USD: 50, // $0.50
      EUR: 50, // €0.50
      GBP: 30, // £0.30
      CAD: 50, // C$0.50
    };

    const minimum = minimums[currency.toUpperCase()] || 50;
    return amount >= minimum;
  }

  getPaymentMethodIcon(type: string): string {
    const icons: { [key: string]: string } = {
      card: '💳',
      paypal: '🅿️',
      bank_transfer: '🏦',
      apple_pay: '🍎',
      google_pay: '🅖',
    };

    return icons[type] || '💳';
  }

  // Error handling
  handlePaymentError(error: any): string {
    if (error.type === 'card_error' || error.type === 'validation_error') {
      return error.message;
    }

    // Generic error messages
    const errorMessages: { [key: string]: string } = {
      'card_declined': 'Your card was declined. Please try a different payment method.',
      'insufficient_funds': 'Insufficient funds. Please try a different payment method.',
      'expired_card': 'Your card has expired. Please try a different payment method.',
      'incorrect_cvc': 'Your card\'s security code is incorrect.',
      'processing_error': 'An error occurred while processing your payment. Please try again.',
      'rate_limit': 'Too many requests. Please wait a moment and try again.',
    };

    return errorMessages[error.code] || 'An unexpected error occurred. Please try again.';
  }
}

// Create and export a singleton instance
const paymentService = new PaymentService();
export default paymentService;
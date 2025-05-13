
import { toast } from "sonner";
import { doc, getFirestore, collection, addDoc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";

class RazorpayService {
  private razorpayLoaded = false;
  // Use environment variable for the publishable Razorpay key
  private readonly RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
  private readonly API_URL = import.meta.env.VITE_API_URL;

  constructor() {
    // Log configuration on initialization to verify env variables are loaded
    console.log("RazorpayService initialized with:", { 
      apiUrl: this.API_URL,
      keyAvailable: !!this.RAZORPAY_KEY 
    });
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    return url.replace(/\/+$/, ''); // Remove trailing slashes
  }

  async loadRazorpay(): Promise<boolean> {
    if (this.razorpayLoaded) return true;
    
    console.log("Loading Razorpay script...");
    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        this.razorpayLoaded = true;
        resolve(true);
      };
      script.onerror = (error) => {
        console.error("Failed to load Razorpay script:", error);
        toast.error("Failed to load payment gateway");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  async createOrder(pollId: string): Promise<{ orderId: string, amount: number }> {
    try {
      if (!pollId) {
        throw new Error("Poll ID is required");
      }
      
      // Normalize the API URL and construct the endpoint
      const baseUrl = this.normalizeUrl(this.API_URL);
      if (!baseUrl) {
        throw new Error("API URL is not configured. Check your VITE_API_URL environment variable.");
      }
      
      const apiUrl = `${baseUrl}/api/create-order`;
      console.log("Creating order at URL:", apiUrl);
      console.log("With poll ID:", pollId);
      
      // Call our serverless function to create an order
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pollId }),
        mode: 'cors'
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text() || `Status ${response.status}`;
        }
        console.error("Error response:", errorText);
        throw new Error(`Failed to create order: ${errorText}`);
      }
      
      const orderData = await response.json();
      console.log("Order created:", orderData);
      return {
        orderId: orderData.orderId,
        amount: orderData.amount
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async openCheckout(pollId: string, onSuccess: () => void): Promise<void> {
    try {
      console.log("Starting payment process for poll:", pollId);
      
      const loaded = await this.loadRazorpay();
      if (!loaded) {
        toast.error("Could not load payment gateway");
        return;
      }
      
      if (!this.RAZORPAY_KEY) {
        toast.error("Payment gateway not configured");
        console.error("Razorpay key is not available. Check your VITE_RAZORPAY_KEY_ID environment variable.");
        return;
      }

      // Create the order
      const { orderId, amount } = await this.createOrder(pollId);
      console.log("Got order details:", { orderId, amount });
      
      // Configure Razorpay options
      const options = {
        key: this.RAZORPAY_KEY,
        amount,
        currency: "INR",
        name: "AskIt",
        description: "Pin your poll for 1 hour",
        order_id: orderId,
        handler: async (response: any) => {
          console.log("Payment response received:", response);
          try {
            // Verify the payment
            const success = await this.verifyPayment(
              pollId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            
            if (success) {
              toast.success("Poll pinned successfully for 1 hour!");
              onSuccess();
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error(`Verification failed: ${error.message}`);
          }
        },
        prefill: {
          name: "Anonymous User",
        },
        theme: {
          color: "#9b87f5",
        },
        modal: {
          ondismiss: function() {
            toast.info("Payment canceled");
          }
        }
      };

      console.log("Opening Razorpay with options:", { ...options, key: "[REDACTED]" });
      
      // Open Razorpay checkout
      // @ts-ignore - Razorpay is loaded via script
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any){
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      razorpay.open();
      
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment initialization failed: ${error.message}`);
    }
  }

  private async verifyPayment(
    pollId: string, 
    razorpay_order_id: string, 
    razorpay_payment_id: string, 
    razorpay_signature: string
  ): Promise<boolean> {
    try {
      // Normalize the API URL
      const baseUrl = this.normalizeUrl(this.API_URL);
      if (!baseUrl) {
        throw new Error("API URL is not configured");
      }
      
      // Construct verification API URL
      const apiUrl = `${baseUrl}/api/verify-payment`;
      console.log("Verifying payment at URL:", apiUrl);
      
      // Call our serverless function to verify the payment
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        }),
        mode: 'cors'
      });
      
      console.log("Verification response status:", response.status);
      
      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text() || `Status ${response.status}`;
        }
        console.error("Verification error response:", errorText);
        throw new Error(`Payment verification failed: ${errorText}`);
      }
      
      const verificationData = await response.json();
      console.log("Verification response:", verificationData);
      
      if (verificationData.verified) {
        try {
          // Payment verification succeeded, now update Firestore
          const db = getFirestore();
          
          // Record the payment in Firestore
          const paymentsRef = collection(db, "payments");
          await addDoc(paymentsRef, {
            pollId,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: 1000, // ₹10.00 in paise
            status: "completed",
            createdAt: serverTimestamp()
          });
          
          // Update the poll with pinned status
          const pollRef = doc(db, "polls", pollId);
          const pollDoc = await getDoc(pollRef);
          
          if (pollDoc.exists()) {
            // Calculate pin expiry time (1 hour from now)
            const pinExpiresAt = new Date();
            pinExpiresAt.setHours(pinExpiresAt.getHours() + 1);
            
            await updateDoc(pollRef, {
              isPinned: true,
              pinExpiresAt: serverTimestamp()
            });
            
            console.log("Poll updated with pinned status");
            return true;
          } else {
            console.error("Poll document not found");
            return false;
          }
        } catch (firestoreError) {
          console.error("Firestore update error:", firestoreError);
          throw new Error(`Payment verified but failed to update database: ${firestoreError.message}`);
        }
      }
      
      return false;
    } catch (error) {
      console.error("Payment verification error:", error);
      throw error;
    }
  }
}

export const razorpayService = new RazorpayService();

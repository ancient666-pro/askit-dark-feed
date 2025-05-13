
import { toast } from "sonner";
import { doc, getFirestore, collection, addDoc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";

class RazorpayService {
  private razorpayLoaded = false;
  // Use environment variable for the publishable Razorpay key
  private readonly RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_8tiNhEnOjiBMuA";
  private readonly API_URL = import.meta.env.VITE_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://askit-kappa.vercel.app' 
      : 'http://localhost:3000');

  async loadRazorpay(): Promise<boolean> {
    if (this.razorpayLoaded) return true;
    
    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.razorpayLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        toast.error("Failed to load payment gateway");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  async createOrder(pollId: string): Promise<{ orderId: string, amount: number }> {
    try {
      // Log the API URL to verify it's correct
      console.log("Creating order with base API URL:", this.API_URL);
      
      // Remove any trailing slashes from API URL
      const baseUrl = this.API_URL.replace(/\/+$/, '');
      
      // Construct final API URL
      const apiUrl = `${baseUrl}/api/create-order`;
      
      console.log("Final API URL:", apiUrl);
      
      // Call our serverless function to create an order
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pollId }),
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to create order: ${errorText || `Status ${response.status}`}`);
      }
      
      const orderData = await response.json();
      console.log("Order created:", orderData);
      return {
        orderId: orderData.orderId,
        amount: orderData.amount
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async openCheckout(pollId: string, onSuccess: () => void): Promise<void> {
    const loaded = await this.loadRazorpay();
    if (!loaded) {
      toast.error("Could not load payment gateway");
      return;
    }

    try {
      console.log("Starting payment process for poll:", pollId);
      const { orderId, amount } = await this.createOrder(pollId);
      console.log("Got order details:", { orderId, amount });
      
      const options = {
        key: this.RAZORPAY_KEY,
        amount,
        currency: "INR",
        name: "AskIt",
        description: "Pin your poll for 1 hour",
        order_id: orderId,
        handler: async (response: any) => {
          console.log("Payment response received:", response);
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
      
      // @ts-ignore - Razorpay is loaded via script
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      
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
      // Remove any trailing slashes from API URL
      const baseUrl = this.API_URL.replace(/\/+$/, '');
      
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
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Verification error response:", errorText);
        throw new Error(`Payment verification failed: ${errorText || `Status ${response.status}`}`);
      }
      
      const verificationData = await response.json();
      console.log("Verification response:", verificationData);
      
      if (verificationData.verified) {
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
          
          return true;
        } else {
          console.error("Poll document not found");
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();

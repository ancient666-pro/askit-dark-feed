
import { toast } from "sonner";
import { firebaseService } from "./firebase";

class RazorpayService {
  private razorpayLoaded = false;
  // Replace with your actual test key - this is a publishable key so it's fine in the frontend
  private readonly RAZORPAY_KEY = "rzp_test_SCBtEItlo6cdZj";

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
    // In a real app, this would call a Firebase function to create an order
    // For demo purposes, we'll generate a fake order ID
    return {
      orderId: `order_${Math.random().toString(36).substring(2, 15)}`,
      amount: 1000 // ₹10.00 in paise
    };
  }

  async openCheckout(pollId: string, onSuccess: () => void): Promise<void> {
    const loaded = await this.loadRazorpay();
    if (!loaded) return;

    try {
      const { orderId, amount } = await this.createOrder(pollId);
      
      const options = {
        key: this.RAZORPAY_KEY,
        amount,
        currency: "INR",
        name: "AskIt",
        description: "Pin your poll for 1 hour",
        order_id: orderId,
        handler: async (response: any) => {
          // In a real app, verify this payment on the server
          const success = await this.verifyPayment(
            pollId, 
            orderId, 
            response.razorpay_payment_id
          );
          
          if (success) {
            toast.success("Poll pinned successfully for 1 hour!");
            onSuccess();
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

      // @ts-ignore - Razorpay is loaded via script
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment initialization failed");
    }
  }

  private async verifyPayment(pollId: string, orderId: string, paymentId: string): Promise<boolean> {
    // In a real app, verify with your backend
    // For demo, we'll assume it's successful
    try {
      const updatedPoll = await firebaseService.pinPoll({
        pollId,
        orderId,
        paymentId
      });
      
      return !!updatedPoll;
    } catch (error) {
      console.error("Pin verification error:", error);
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();

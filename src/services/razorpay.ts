
import { toast } from "sonner";
import { firebaseService } from "./firebase";
import { doc, getFirestore, collection, addDoc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";

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
    try {
      // Create an order document in Firestore
      const db = getFirestore();
      const ordersRef = collection(db, "orders");
      
      // Create the order with pending status
      const orderData = {
        pollId,
        amount: 1000, // ₹10.00 in paise
        currency: "INR",
        status: "pending",
        createdAt: serverTimestamp()
      };
      
      // Add to Firestore
      const orderDoc = await addDoc(ordersRef, orderData);
      
      // In a production environment, you would use Firebase Functions to securely create a Razorpay order
      // and return the actual orderId from Razorpay. For this demo, we're using the Firestore document ID.
      return {
        orderId: orderDoc.id,
        amount: orderData.amount
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error("Failed to create order");
    }
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
        order_id: orderId, // In production, this would be the actual Razorpay order ID
        handler: async (response: any) => {
          // In a real app, verify this payment on the server
          const success = await this.verifyPayment(
            pollId, 
            orderId, 
            response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 15)}`
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
    try {
      // Update the order status in Firestore
      const db = getFirestore();
      const orderRef = doc(db, "orders", orderId);
      
      // In production, this verification would happen securely in Firebase Functions
      // Here we're just updating the order status in Firestore directly
      await updateDoc(orderRef, {
        status: "completed",
        paymentId,
        completedAt: serverTimestamp()
      });
      
      // Call the Firebase service to pin the poll
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


export class DeviceIdManager {
  private deviceId: string;

  constructor() {
    this.deviceId = localStorage.getItem("deviceId") || this.generateDeviceId();
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", this.deviceId);
    }
  }

  private generateDeviceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  getDeviceId(): string {
    return this.deviceId;
  }
}

export const deviceIdManager = new DeviceIdManager();

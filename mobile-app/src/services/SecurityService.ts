import {NativeModules} from 'react-native';
import type {DeviceSecurityInfo} from '../types';

const {SecurityModule} = NativeModules;

class SecurityService {
  async checkDeviceSecurity(): Promise<DeviceSecurityInfo> {
    return await SecurityModule.isDeviceSecure();
  }

  async encryptData(data: string, password: string): Promise<string> {
    if (!data || !password) {
      throw new Error('Data and password are required for encryption');
    }
    return await SecurityModule.encryptData(data, password);
  }

  async decryptData(encryptedData: string, password: string): Promise<string> {
    if (!encryptedData || !password) {
      throw new Error('Encrypted data and password are required for decryption');
    }
    return await SecurityModule.decryptData(encryptedData, password);
  }
}

export const securityService = new SecurityService();
export default securityService;

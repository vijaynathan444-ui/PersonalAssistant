import securityService from '../../services/SecurityService';
import {NativeModules} from 'react-native';

describe('SecurityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDeviceSecurity', () => {
    it('should call native security module', async () => {
      NativeModules.SecurityModule.isDeviceSecure.mockResolvedValue({
        isRooted: false,
        isEmulator: false,
        isDebuggerAttached: false,
        secure: true,
      });

      const result = await securityService.checkDeviceSecurity();
      expect(result.secure).toBe(true);
      expect(result.isRooted).toBe(false);
    });

    it('should detect insecure device', async () => {
      NativeModules.SecurityModule.isDeviceSecure.mockResolvedValue({
        isRooted: true,
        isEmulator: false,
        isDebuggerAttached: false,
        secure: false,
      });

      const result = await securityService.checkDeviceSecurity();
      expect(result.secure).toBe(false);
      expect(result.isRooted).toBe(true);
    });
  });

  describe('encryptData', () => {
    it('should reject empty data', async () => {
      await expect(
        securityService.encryptData('', 'password'),
      ).rejects.toThrow('Data and password are required');
    });

    it('should reject empty password', async () => {
      await expect(
        securityService.encryptData('data', ''),
      ).rejects.toThrow('Data and password are required');
    });

    it('should call native encryption', async () => {
      NativeModules.SecurityModule.encryptData.mockResolvedValue('encrypted_base64');

      const result = await securityService.encryptData('secret', 'password123');
      expect(result).toBe('encrypted_base64');
      expect(NativeModules.SecurityModule.encryptData).toHaveBeenCalledWith(
        'secret',
        'password123',
      );
    });
  });

  describe('decryptData', () => {
    it('should reject empty encrypted data', async () => {
      await expect(
        securityService.decryptData('', 'password'),
      ).rejects.toThrow('Encrypted data and password are required');
    });

    it('should call native decryption', async () => {
      NativeModules.SecurityModule.decryptData.mockResolvedValue('decrypted_text');

      const result = await securityService.decryptData('encrypted', 'password123');
      expect(result).toBe('decrypted_text');
    });
  });
});

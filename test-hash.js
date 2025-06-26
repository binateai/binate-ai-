// Test script for password verification
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Function to compare passwords
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Test the function with the actual hash from the database
async function testPasswordVerification() {
  const storedHash = 'dc9472ddec21ebd8750567bd349f06eb28f73396a289cb1ee761318ca961a01e21866b4636d2bab27205231b3c25a8185d1873e1e5cf2d15c31b9118085b5af3.3a5998ef9e9b1383876fcf6ddeff9e57';
  const testPassword = 'testpassword';
  
  try {
    const result = await comparePasswords(testPassword, storedHash);
    console.log(`Password verification result: ${result ? 'Success' : 'Failed'}`);
  } catch (error) {
    console.error('Error during password verification:', error);
  }
}

testPasswordVerification();
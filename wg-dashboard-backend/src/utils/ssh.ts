import { Client } from 'ssh2';
import * as fs from 'fs';

/**
 * Loads an SSH private key from environment variables or file path
 * @returns The loaded private key as a string
 * @throws Error if the key cannot be loaded
 */
export async function loadSshPrivateKey(): Promise<string> {
  const keyString = process.env.SSH_PRIVATE_KEY_STRING;
  const keyPath = process.env.SSH_PRIVATE_KEY_PATH;

  if (keyString) {
    return keyString;
  } else if (keyPath) {
    try {
      return fs.readFileSync(keyPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read SSH private key from file: ${(error as Error).message}`);
    }
  }
  
  throw new Error('No SSH private key found in environment variables');
}

/**
 * Creates an SSH connection to a remote server
 * @param host Remote server hostname or IP
 * @param username SSH username
 * @param privateKey SSH private key
 * @returns Promise resolving to an SSH2 Client instance
 */
export function createSshConnection(
  host: string,
  username: string,
  privateKey: string
): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      resolve(client);
    });

    client.on('error', (err) => {
      reject(new Error(`SSH connection error: ${err.message}`));
    });

    try {
      client.connect({
        host,
        username,
        privateKey,
        readyTimeout: 10000, // 10 second timeout
      });
    } catch (error) {
      reject(new Error(`Failed to initiate SSH connection: ${(error as Error).message}`));
    }
  });
}

/**
 * Executes a command on a remote server via SSH
 * @param connection Active SSH client connection
 * @param command Command to execute
 * @returns Promise resolving to command output
 */
export function executeSshCommand(
  connection: Client,
  command: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    connection.exec(command, (err: Error | undefined, stream) => {
      if (err) {
        reject(new Error(`Failed to execute command: ${err.message}`));
        return;
      }

      let stdout = '';
      let stderr = '';

      stream.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      stream.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      stream.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        } else {
          resolve({ stdout, stderr });
        }
      });

      stream.on('error', (err) => {
        reject(new Error(`Stream error: ${err.message}`));
      });
    });
  });
} 
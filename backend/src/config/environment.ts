/**
 * Configuration & Environment Variables
 * ======================================
 * Centralizes environment configuration with safe defaults for local development.
 * Never stores or exports AWS credentials or secret tokens.
 */

export interface AppConfig {
  awsRegion: string;
  tableName: string;
  corsOrigin: string;
  isOffline: boolean;
}

export const config: AppConfig = {
  awsRegion: process.env.AWS_REGION || 'ap-south-1',
  tableName: process.env.DYNAMODB_TABLE_NAME || 'CampusSOS-Reports',
  // In local development, explicitly permit the local Vite frontend origin.
  // In production deployment (Phase 10), this will be configured with the deployed AWS Amplify URL.
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isOffline: process.env.IS_OFFLINE === 'true' || !process.env.AWS_LAMBDA_FUNCTION_NAME,
};

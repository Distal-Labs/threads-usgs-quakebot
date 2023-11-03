import type {Config} from 'jest';
import { Log, LogLevel } from "@miniflare/shared";

const config: Config = {
  bail: 1000,
  verbose: false,
  collectCoverage: true,
  preset: 'ts-jest',
  testEnvironment: 'miniflare',
  // See https://miniflare.dev/get-started/api#reference
  testEnvironmentOptions: {
    log: new Log(LogLevel.VERBOSE), // Enable --debug messages
    wranglerConfigPath: true, // Load configuration from wrangler.toml
    wranglerConfigEnv: "preview", // Environment in wrangler.toml to use
    envPath: "./.env.dev", // ...or custom .env path
    // host: "127.0.0.1", // Host for HTTP(S) server to listen on
    // port: 8788, // Port for HTTP(S) server to listen on
    // https: "./.wrangler/cert_cache", // Cache in ./cert_cache instead
    // globals: { 
    //   APP_JWT_INITIALIZATION_VECTOR: new Uint8Array([28,  81, 238,  92,  47, 38,  94,  19, 201, 135, 130, 104])
    // }, // Binds variable/secret to global scope
  },
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  testPathIgnorePatterns: [
    './tests/utils.ts',
    'ENV'
  ],
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest',
  },
};

export default config;

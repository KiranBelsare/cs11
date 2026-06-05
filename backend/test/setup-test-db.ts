import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongooseModule } from '@nestjs/mongoose'

let mongoServer: MongoMemoryServer | undefined

export const TestDatabase = {
  /**
   * Returns a MongooseModule configured with an in-memory MongoDB instance.
   * Call this in place of the real `MongooseModule.forRoot(...)` in AppModule.
   *
   * Usage in each e2e spec:
   *   beforeAll(async () => {
   *     await TestDatabase.connect()
   *     // ... rest of app init
   *   })
   */
  async connect(): Promise<string> {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    process.env.MONGODB_URI = mongoUri
    return mongoUri
  },

  async close(): Promise<void> {
    if (mongoServer) {
      await mongoServer.stop()
      mongoServer = undefined
    }
  },
}

/**
 * NestJS MongooseModule options for the in-memory server.
 * Pass this to `MongooseModule.forRoot()` in the test environment.
 */
export const rootMongooseTestModule = {
  uri: '', // URI is injected from TestDatabase.connect() via process.env
}
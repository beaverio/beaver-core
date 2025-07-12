import express, { Request, Response } from 'express';
import cors from 'cors';
import supertokens from 'supertokens-node';
import { middleware, errorHandler, SessionRequest } from 'supertokens-node/framework/express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';

// Minimal SuperTokens setup
supertokens.init({
  framework: 'express',
  supertokens: {
    connectionURI: process.env.SUPERTOKENS_CONNECTION_URI!,
  },
  appInfo: {
    appName: 'beaver-core',
    apiDomain: 'http://localhost:3000',
    websiteDomain: 'http://localhost:3000',
    apiBasePath: '/auth',
    websiteBasePath: '/auth'
  },
  recipeList: [
    EmailPassword.init(),
    Session.init({
      getTokenTransferMethod: () => "any"
    })
  ]
});

const app = express();

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  credentials: true,
}));
app.use(middleware());
app.use(express.json());

// Basic routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is running' });
});

// Protected route
app.get('/protected', verifySession(), (req: SessionRequest, res: Response) => {
  const session = req.session!;
  console.log(req.session)
  res.json({
    message: 'Protected content',
    userId: session.getUserId()
  });
});

// Error handling
app.use(errorHandler());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth endpoints at http://localhost:${PORT}/auth`);
});

export default app;

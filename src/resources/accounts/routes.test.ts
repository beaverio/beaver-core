import request from 'supertest';
import express from 'express';

jest.mock('@src/middleware/validate-body', () => ({
  validateBody: () => (req: any, res: any, next: any) => next(),
}));
jest.mock('./utils', () => ({
  requireAccountOwner: (req: any, res: any, next: any) => next(),
}));

import router from './routes';

jest.mock('./controller', () => ({
  __esModule: true,
  createAccount: jest.fn((req, res) => res.status(201).json({ account: { id: 'acc-1', primaryUserId: 'user-1' } })),
  deleteAccount: jest.fn((req, res) => res.status(204).send()),
  addMember: jest.fn((req, res) => res.status(201).json({ message: 'User added with roles: READ' })),
}));

const app = express();
app.use(express.json());
app.use('/accounts', router);

describe('Accounts Routes', () => {
  it('POST /accounts should return 201 and account', async () => {
    const res = await request(app)
      .post('/accounts')
      .send({ primaryUserId: 'user-1' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ account: { id: 'acc-1', primaryUserId: 'user-1' } });
  });

  it('DELETE /accounts/:accountId should return 204', async () => {
    const res = await request(app)
      .delete('/accounts/acc-1');
    expect(res.status).toBe(204);
  });

  it('POST /accounts/:accountId/members should return 201 and message', async () => {
    const res = await request(app)
      .post('/accounts/acc-1/members')
      .send({ userId: 'user-2', roles: ["READ"] });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'User added with roles: READ' });
  });
});

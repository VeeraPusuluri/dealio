import request from 'supertest';
import app from '../app';

describe('Health Check', () => {
  it('should return 200 and OK status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'OK',
      message: 'Dealio Backend is running'
    });
  });
});

describe('Auth API', () => {
  it('should request OTP', async () => {
    const res = await request(app)
      .post('/api/auth/login/phone/send-otp')
      .send({ phone: '1234567890' });
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should verify OTP and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login/phone/verify-otp')
      .send({ phone: '1234567890', otp: '123456' });
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
  });
});

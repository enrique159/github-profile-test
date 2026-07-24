import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the service health', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});

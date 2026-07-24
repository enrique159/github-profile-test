import { validateEnvironment } from './app.config';

describe('validateEnvironment', () => {
  it('allows development without a GitHub token', () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: 'development' }),
    ).not.toThrow();
  });

  it('requires a GitHub token in production', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'GITHUB_TOKEN is required in production',
    );
  });

  it('allows production with a GitHub token', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        GITHUB_TOKEN: 'token',
      }),
    ).not.toThrow();
  });
});

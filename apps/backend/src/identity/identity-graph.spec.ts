import { Test, TestingModule } from '@nestjs/testing';
import { IdentityGraphService } from './identity-graph.service';
import * as fs from 'fs';
import * as path from 'path';

describe('IdentityGraphService', () => {
  let service: IdentityGraphService;
  const sandboxPath = path.join(
    process.cwd(),
    'apps',
    'backend',
    'logs',
    'identity-graph-sandbox.json',
  );

  beforeEach(async () => {
    // Clear/reset sandbox file for tests
    if (fs.existsSync(sandboxPath)) {
      try {
        fs.unlinkSync(sandboxPath);
      } catch (err) {
        // ignore if file does not exist
      }
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentityGraphService],
    }).compile();

    service = module.get<IdentityGraphService>(IdentityGraphService);
    service.onModuleInit();
  });

  it('should create a new profile if no identifiers match', async () => {
    const profile = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'user1@example.com' },
    ]);

    expect(profile).toBeDefined();
    expect(profile.id).toContain('prof-');
    expect(profile.workspaceId).toBe('ws-test');

    const graph = await service.getIdentityGraph('ws-test');
    expect(graph.profiles).toHaveLength(1);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].identifierValue).toBe('user1@example.com');
  });

  it('should resolve to the same profile if deterministic identifiers match', async () => {
    const profile1 = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'user2@example.com' },
    ]);

    const profile2 = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'user2@example.com' },
      { type: 'COOKIE', value: 'cookie-abc' },
    ]);

    expect(profile1.id).toBe(profile2.id);

    const graph = await service.getIdentityGraph('ws-test');
    expect(graph.profiles).toHaveLength(1);
    expect(graph.nodes).toHaveLength(2); // email node and cookie node
    expect(graph.edges).toHaveLength(1); // link between email and cookie
  });

  it('should merge profiles when a common identifier stitches them', async () => {
    // 1. Create Profile A with Cookie X
    const profileA = await service.resolveProfile('ws-test', [
      { type: 'COOKIE', value: 'cookie-x' },
    ]);

    // 2. Create Profile B with Email Y
    const profileB = await service.resolveProfile('ws-test', [
      { type: 'EMAIL', value: 'email-y@test.com' },
    ]);

    expect(profileA.id).not.toBe(profileB.id);

    // 3. User logs in, linking Cookie X and Email Y
    const resolvedProfile = await service.resolveProfile('ws-test', [
      { type: 'COOKIE', value: 'cookie-x' },
      { type: 'EMAIL', value: 'email-y@test.com' },
    ]);

    // Should merge them, resolving to the oldest profile ID
    const oldestId = [profileA, profileB].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0].id;

    expect(resolvedProfile.id).toBe(oldestId);

    const graph = await service.getIdentityGraph('ws-test');
    expect(graph.profiles).toHaveLength(1);
  });

  it('should stitch probabilistically when confidence is above threshold', async () => {
    const profileA = await service.resolveProfile('ws-test', [
      { type: 'COOKIE', value: 'cookie-z' },
    ]);

    // Match probabilistically with high confidence (e.g. 0.8)
    const profileB = await service.resolveProfile(
      'ws-test',
      [],
      [{ type: 'COOKIE', value: 'cookie-z', confidence: 0.8 }],
    );

    expect(profileA.id).toBe(profileB.id);

    // Should NOT stitch if confidence is below threshold (e.g. 0.5)
    const profileC = await service.resolveProfile(
      'ws-test',
      [],
      [{ type: 'COOKIE', value: 'cookie-z', confidence: 0.5 }],
    );

    expect(profileC.id).not.toBe(profileA.id);
  });
});

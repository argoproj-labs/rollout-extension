import {parseReplicaSets} from './index';

jest.mock('antd', () => ({ConfigProvider: () => null}));
jest.mock('argo-rollouts/ui/src/app/components/rollout/rollout', () => ({RolloutWidget: () => null}));
jest.mock('axios', () => ({get: jest.fn()}));

const currentHash = '66d7b68dff';
const previousHash = '6bb7d59789';
const historicalHash = '5c9855cffd';

const replicaSetName = (hash: string) => `demo-${hash}`;

const replicaSet = (hash: string, revision: number) => ({
    kind: 'ReplicaSet',
    name: replicaSetName(hash),
    namespace: 'default',
    parentRefs: [{kind: 'Rollout', name: 'demo'}],
    health: {status: 'Healthy'},
    info: [{name: 'Revision', value: `rev:${revision}`}]
});

const pod = (hash: string) => ({
    kind: 'Pod',
    name: `${replicaSetName(hash)}-abcde`,
    namespace: 'default',
    parentRefs: [{kind: 'ReplicaSet', name: replicaSetName(hash)}],
    images: [`example/demo:${hash}`],
    info: [
        {name: 'Status Reason', value: 'Running'},
        {name: 'Containers', value: '1/1'}
    ]
});

const parse = (status: any, previousPods = 0) => parseReplicaSets({nodes: [
    replicaSet(currentHash, 3),
    replicaSet(previousHash, 2),
    replicaSet(historicalHash, 1),
    pod(currentHash),
    ...(previousPods ? [pod(previousHash)] : [])
]}, {
    metadata: {name: 'demo'},
    spec: {strategy: {canary: {}}},
    status
});

const roles = (replicaSets: ReturnType<typeof parseReplicaSets>) => replicaSets.map(rs => ({
    name: rs.objectMeta.name,
    stable: rs.stable,
    canary: rs.canary
}));

describe('canary ReplicaSet roles', () => {
    describe.each([0, 1])('after promotion with %i previous Pods', previousPods => {
        it('marks only the promoted ReplicaSet stable when weight hashes match', () => {
            const result = parse({
                stableRS: currentHash,
                currentPodHash: currentHash,
                canary: {weights: {
                    stable: {podTemplateHash: currentHash, weight: 100},
                    canary: {podTemplateHash: currentHash, weight: 0}
                }}
            }, previousPods);

            expect(roles(result)).toEqual([
                {name: replicaSetName(currentHash), stable: true, canary: false},
                {name: replicaSetName(previousHash), stable: false, canary: false},
                {name: replicaSetName(historicalHash), stable: false, canary: false}
            ]);
            expect(result[1].pods || []).toHaveLength(previousPods);
        });

        it('uses stableRS and currentPodHash when weight hashes are absent', () => {
            expect(roles(parse({stableRS: currentHash, currentPodHash: currentHash}, previousPods))).toEqual([
                {name: replicaSetName(currentHash), stable: true, canary: false},
                {name: replicaSetName(previousHash), stable: false, canary: false},
                {name: replicaSetName(historicalHash), stable: false, canary: false}
            ]);
        });
    });

    it('distinguishes stable, canary and historical ReplicaSets during an update', () => {
        const result = parse({
            stableRS: previousHash,
            currentPodHash: currentHash,
            canary: {weights: {
                stable: {podTemplateHash: previousHash, weight: 80},
                canary: {podTemplateHash: currentHash, weight: 20}
            }}
        }, 1);

        expect(roles(result)).toEqual([
            {name: replicaSetName(currentHash), stable: false, canary: true},
            {name: replicaSetName(previousHash), stable: true, canary: false},
            {name: replicaSetName(historicalHash), stable: false, canary: false}
        ]);
        expect(result[0].pods[0].canary).toBe(true);
        expect(result[1].pods[0].canary).toBe(false);
    });

    it('does not invent a stable ReplicaSet before one is recorded', () => {
        expect(roles(parse({currentPodHash: currentHash}))).toEqual([
            {name: replicaSetName(currentHash), stable: false, canary: true},
            {name: replicaSetName(previousHash), stable: false, canary: false},
            {name: replicaSetName(historicalHash), stable: false, canary: false}
        ]);
    });
});

import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {RolloutWidget} from 'argo-rollouts/ui/src/app/components/rollout/rollout';
import {Extension} from './index';

jest.mock('axios', () => ({get: jest.fn()}));
jest.mock('antd', () => ({ConfigProvider: ({children}: any) => children}));
jest.mock('argo-rollouts/ui/src/app/components/rollout/rollout', () => ({RolloutWidget: jest.fn(() => null)}));

const rollout = {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Rollout',
    metadata: {name: 'demo', namespace: 'default'},
    spec: {strategy: {canary: {steps: []}}, template: {spec: {containers: []}}},
    status: {replicas: 1, availableReplicas: 1, stableRS: 'abc123', currentPodHash: 'abc123'}
};

const replicaSet = {
    kind: 'ReplicaSet',
    name: 'demo-abc123',
    uid: 'owned-rs',
    namespace: 'default',
    parentRefs: [{kind: 'Rollout', name: 'demo'}],
    health: {status: 'Healthy'},
    info: [{name: 'Revision', value: 'Revision:1'}]
};

const pod = {
    kind: 'Pod',
    name: 'demo-abc123-pod',
    uid: 'owned-pod',
    namespace: 'default',
    parentRefs: [{kind: 'ReplicaSet', name: 'demo-abc123'}],
    images: ['example/image:latest'],
    info: [{name: 'Containers', value: '1/1'}]
};

describe('resource tree nodes without parents', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (RolloutWidget as jest.Mock).mockReturnValue(null);
    });

    const unownedNodes = ['AnalysisRun', 'ReplicaSet', 'Pod'].flatMap(kind =>
        [undefined, null, []].map(parentRefs => [kind, parentRefs])
    );

    it.each(unownedNodes)('renders an unowned %s with parentRefs=%p while retaining owned resources', (kind, parentRefs) => {
        const nodes = [
            {kind, name: 'unowned', uid: 'unowned', namespace: 'default', parentRefs},
            replicaSet,
            pod
        ];

        expect(() => renderToStaticMarkup(<Extension application={{}} tree={{nodes}} resource={rollout} />)).not.toThrow();

        const parsedRollout = (RolloutWidget as jest.Mock).mock.calls[0][0].rollout;
        expect(parsedRollout.replicaSets).toHaveLength(1);
        expect(parsedRollout.replicaSets[0].objectMeta.name).toBe('demo-abc123');
        expect(parsedRollout.replicaSets[0].pods).toHaveLength(1);
        expect(parsedRollout.replicaSets[0].pods[0].objectMeta.name).toBe('demo-abc123-pod');
        expect(parsedRollout.replicaSets[0].images).toEqual(['example/image:latest']);
    });
});

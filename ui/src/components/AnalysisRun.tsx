import * as React from 'react';
import { AnalysisWidget } from 'argo-rollouts/ui/src/app/components/analysis-modal/analysis-widget';
// import { RolloutAnalysisRunInfo } from 'argo-rollouts/ui/src/models/rollout/generated';
import { State, ApplicationResourceTree } from '../shared';


export const AnalysisRunExtension = (props: { application: any; tree: ApplicationResourceTree; resource: State }) => {
  // const ro = parseInfoFromResourceNode(props.application, props.tree, props.resource);
  // const an = parseAnalysisRuns

  console.log(props.resource);

  const { resource } = props

  const analysis = {
    objectMeta: {
      creationTimestamp: {
        seconds: resource.metadata.creationTimestamp
      },
      name: resource.metadata.name,
      namespace: resource.metadata.namespace,
      resourceVersion: resource.metadata.resourceVersion,
      uid: resource.metadata.uid
    },
    specAndStatus: {
      spec: resource.spec,
      status: resource.status || null
    },
    // revision: parseRevision(node),
    // status: parseAnalysisRunStatus(node.health.status)
  };

  return (
    <div style={{ display: 'flex', margin: '0 auto' }}>
      <div className='rollout__row rollout__row--top'>
        <div className='info' style={{ width: '100%' }}>
          <AnalysisWidget analysis={analysis} images={[]} revision={''} />
        </div>
      </div>
    </div>
  );
};

import * as React from 'react';
import { Tabs } from 'antd';
import classNames from 'classnames';
import MetricLabel from 'argo-rollouts/ui/src/app/components/analysis-modal/metric-label/metric-label';
import { MetricPanel, SummaryPanel } from 'argo-rollouts/ui/src/app/components/analysis-modal/panels';
import { analysisEndTime, analysisStartTime, getAdjustedMetricPhase, metricStatusLabel, metricSubstatus, transformMetrics } from 'argo-rollouts/ui/src/app/components/analysis-modal/transforms';
import { AnalysisStatus } from 'argo-rollouts/ui/src/app/components/analysis-modal/types';
import { State, ApplicationResourceTree } from '../shared';
import 'argo-rollouts/ui/src/app/components/analysis-modal/styles.scss';

const cx = classNames;

export const AnalysisRunExtension = (props: { application: any; tree: ApplicationResourceTree; resource: State }) => {
  const { resource } = props;

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
  };

  const analysisResults = analysis.specAndStatus?.status;
  const analysisStart = analysisStartTime(analysis.objectMeta?.creationTimestamp as any);
  const analysisEnd = analysisEndTime(analysisResults?.metricResults ?? []);
  const analysisSubstatus = metricSubstatus(
    (analysisResults?.phase ?? AnalysisStatus.Unknown) as AnalysisStatus,
    analysisResults?.runSummary?.failed ?? 0,
    analysisResults?.runSummary?.error ?? 0,
    analysisResults?.runSummary?.inconclusive ?? 0
  );
  const transformedMetrics = transformMetrics(analysis.specAndStatus);
  const adjustedAnalysisStatus = getAdjustedMetricPhase(undefined as AnalysisStatus);

  const tabItems = [
    {
      label: <MetricLabel label='Summary' status={adjustedAnalysisStatus} substatus={analysisSubstatus} />,
      key: 'analysis-summary',
      children: (
        <SummaryPanel
          title={metricStatusLabel(AnalysisStatus.Unknown, 0, 0, 0)}
          status={adjustedAnalysisStatus}
          substatus={analysisSubstatus}
          images={[]}
          revision={''}
          message={analysisResults?.message}
          startTime={analysisStart}
          endTime={analysisEnd}
        />
      ),
    },
    ...Object.values(transformedMetrics)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((metric) => ({
        label: <MetricLabel label={metric.name} status={metric.status.adjustedPhase} substatus={metric.status.substatus} />,
        key: metric.name,
        children: (
          <MetricPanel
            metricName={metric.name}
            status={(metric.status.phase ?? AnalysisStatus.Unknown) as AnalysisStatus}
            substatus={metric.status.substatus}
            metricSpec={metric.spec}
            metricResults={metric.status}
          />
        ),
      })),
  ];

  return (
    <div style={{ display: 'flex', margin: '0 auto' }}>
      <div className='rollout__row rollout__row--top'>
        <div className='info' style={{ width: '100%' }}>
          <Tabs className={cx('tabs')} items={tabItems} tabPosition='left' size='small' tabBarGutter={12} />
        </div>
      </div>
    </div>
  );
};

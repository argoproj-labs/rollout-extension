import React from "react";
import {
  Box,
  BoxTitle,
  CenteredRow,
  EffectDiv,
  InfoItem,
  InfoItemKind,
  InfoItemRow,
} from "argo-ui/v2";

import "./Extension.scss";

interface ApplicationResourceTree {}

const GetCurrentSetWeight = (spec: any, status: any) => {
  for (let i = status.currentStepIndex; i >= 0; i--) {
    const step = spec.strategy.canary.steps[i];
    if (step.setWeight) {
      return step.setWeight;
    }
  }
};

const GetReplicaSets = (tree: any, rollout: any) => {
  const allReplicaSets = [];
  const allPods = [];
  for (const node of tree.nodes) {
    if (node.kind === "ReplicaSet") {
      allReplicaSets.push(node);
    } else if (node.kind === "Pod") {
      allPods.push(node);
    }
  }

  const ownedReplicaSets: { [key: string]: any } = {};

  for (const rs of allReplicaSets) {
    for (const parentRef of rs.parentRefs) {
      if (parentRef?.kind === "Rollout" && parentRef?.name === rollout?.name) {
        rs.pods = [];
        ownedReplicaSets[rs?.name] = rs;
      }
    }
  }

  for (const pod of allPods) {
    for (const parentRef of pod.parentRefs) {
      const parent = ownedReplicaSets[parentRef?.name];
      if (parentRef.kind === "ReplicaSet" && parent) {
        (parent?.pods || []).push(pod);
      }
    }
  }

  return Object.values(ownedReplicaSets);
};

const ParseRevisionFromInfo = (replicaSet: any): number => {
  const infoItem = replicaSet.info.find((i: any) => i?.name === "Revision");
  return parseInt(infoItem.value.replace("Rev:", ""), 10);
};

const GetRevisions = (replicaSets: any): any[] => {
  if (!replicaSets) {
    return;
  }
  const map: { [key: number]: any } = {};

  const emptyRevision = {
    replicaSets: [],
    experiments: [],
    analysisRuns: [],
  } as any;

  for (const rs of replicaSets || []) {
    const rev = ParseRevisionFromInfo(rs);
    if (!map[rev]) {
      map[rev] = { ...emptyRevision };
    }
    map[rev].number = rev;
    map[rev].replicaSets = [...map[rev].replicaSets, rs];
  }

  const revisions: any[] = [];
  const prevRn = 0;
  Object.keys(map).forEach((key) => {
    const rn = parseInt(key);
    if (rn > prevRn) {
      revisions.unshift(map[rn]);
    } else {
      revisions.push(map[rn]);
    }
  });

  return revisions;
};

enum ImageTag {
  Canary = "canary",
  Stable = "stable",
  Active = "active",
  Preview = "preview",
  Unknown = "unknown",
}

export const IconForTag = (t?: ImageTag) => {
  switch (t) {
    case ImageTag.Canary:
      return "fa-dove";
    case ImageTag.Stable:
      return "fa-thumbs-up";
    case ImageTag.Preview:
      return "fa-search";
    case ImageTag.Active:
      return "fa-running";
    default:
      return "fa-question";
  }
};

const RevisionWidget = (props: { revision: any; current: boolean }) => {
  const { revision } = props;

  return (
    <EffectDiv className="revision">
      <div className="revision__header">Revision {revision.number}</div>
      <div>
        {revision.replicaSets?.map((rs: any, i: any) => {
          let rev = "?";
          for (const item of rs.info) {
            if (item?.name === "Revision" && item.value.startsWith("Rev:")) {
              rev = item.value.slice("Rev:".length);
            }
          }
          return (
            <div className="pods">
              {rs?.name && (
                <div className="pods__header">
                  <span style={{ marginRight: "5px" }}>{rs?.name}</span>{" "}
                  <div style={{ marginLeft: "auto" }}>Revision {rev}</div>
                </div>
              )}

              {rs?.pods && rs.pods.length > 0 && (
                <div className="pods__container">
                  {rs.pods.map((pod: any, i: number) => {
                    let status = "Unknown";
                    for (const item of pod.info) {
                      if (item?.name === "Status Reason") {
                        status = item.value;
                      }
                    }
                    return <PodIcon status={status} key={i} />;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </EffectDiv>
  );
};

enum PodStatus {
  Pending = "pending",
  Success = "success",
  Failed = "failure",
  Warning = "warning",
  Unknown = "unknown",
}

const ParsePodStatus = (status: string): PodStatus => {
  switch (status) {
    case "Pending":
    case "Terminating":
    case "ContainerCreating":
      return PodStatus.Pending;
    case "Running":
    case "Completed":
      return PodStatus.Success;
    case "Failed":
    case "InvalidImageName":
    case "CrashLoopBackOff":
      return PodStatus.Failed;
    case "ImagePullBackOff":
    case "RegistryUnavailable":
      return PodStatus.Warning;
    default:
      return PodStatus.Unknown;
  }
};

const PodIcon = (props: { status: string }) => {
  const { status } = props;
  let icon;
  let spin = false;
  if (status.startsWith("Init:")) {
    icon = "fa-circle-notch";
    spin = true;
  }
  if (status.startsWith("Signal:") || status.startsWith("ExitCode:")) {
    icon = "fa-times";
  }
  if (status.endsWith("Error") || status.startsWith("Err")) {
    icon = "fa-exclamation-triangle";
  }

  const className = ParsePodStatus(status);

  switch (className) {
    case PodStatus.Pending:
      icon = "fa-circle-notch";
      spin = true;
      break;
    case PodStatus.Success:
      icon = "fa-check";
      break;
    case PodStatus.Failed:
      icon = "fa-times";
      break;
    case PodStatus.Warning:
      icon = "fa-exclamation-triangle";
      break;
    default:
      spin = false;
      icon = "fa-question-circle";
      break;
  }

  return (
    <div className={`pod-icon pod-icon--${className}`}>
      <i className={`fa ${icon} ${spin ? "fa-spin" : ""}`} />
    </div>
  );
};

const Containers = (props: { containers: any }) => {
  const { containers } = { ...props };
  return (
    <Box>
      <BoxTitle>Containers</BoxTitle>
      {(containers || []).map((container: any, i: number) => (
        <div
          style={{
            margin: "1em 0",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
          key={i}
        >
          <div style={{ paddingRight: "20px" }}>{container?.name}</div>
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              height: "2em",
              justifyContent: "flex-end",
            }}
          >
            <InfoItem content={container?.image} />
          </div>
        </div>
      ))}
      {(containers || []).length < 2 && (
        <div
          className="filler"
          style={{ paddingBottom: "1em", height: "100%" }}
        >
          <span style={{ marginRight: "5px" }}></span>
          <span style={{ marginRight: "5px" }}>
            <i className="fa fa-boxes" />
          </span>
          Add more containers to fill this space!
        </div>
      )}
    </Box>
  );
};

const parseDuration = (duration: string): string => {
  const lastChar = duration[duration.length - 1];
  if (lastChar === "s" || lastChar === "m" || lastChar === "h") {
    return `${duration}`;
  }
  return `${duration}s`;
};

const Step = (props: {
  step: any;
  complete?: boolean;
  current?: boolean;
  last?: boolean;
}) => {
  let icon: string;
  let content = "";
  let unit = "";
  if (props.step.setWeight) {
    icon = "fa-weight";
    content = `Set Weight: ${props.step.setWeight}`;
    unit = "%";
  }
  if (props.step.pause) {
    icon = "fa-pause-circle";
    if (props.step.pause.duration) {
      content = `Pause: ${parseDuration(`${props.step.pause.duration}`)}`;
    } else {
      content = "Pause";
    }
  }
  if (props.step.analysis) {
    content = "Analysis";
    icon = "fa-chart-bar";
  }
  if (props.step.setCanaryScale) {
    content = "Canary Scale";
  }
  if (props.step.experiment) {
    content = "Experiment";
    icon = "fa-flask";
  }

  return (
    <div>
      <EffectDiv
        className={`steps__step ${
          props.complete ? "steps__step--complete" : ""
        } ${props.current ? "steps__step--current" : ""}`}
      >
        <i className={`fa ${icon}`} /> {content}
        {unit}
      </EffectDiv>
      {!props.last && <div className="steps__connector" />}
    </div>
  );
};

export const Extension = (props: {
  tree: ApplicationResourceTree;
  resource: { status: any; spec: any };
}) => {
  const { resource, tree } = props as any;
  const { spec, status } = resource;

  const replicaSets = GetReplicaSets(tree, resource);
  const revisions = GetRevisions(replicaSets);

  const strategy = spec.strategy.canary ? "Canary" : "BlueGreen";
  const currentStepIndex = status.currentStepIndex;
  const currentStep = spec.strategy.canary.steps[currentStepIndex];

  if (currentStep && status.availableReplicas > 0) {
    if (!spec.strategy.canary.trafficRouting) {
    } else {
    }
  }

  return (
    <div>
      <CenteredRow>
        <Box>
          <BoxTitle>Summary</BoxTitle>

          <InfoItemRow
            items={{
              content: strategy,
              icon: strategy === "Canary" ? "fa-dove" : "fa-palette",
              kind: strategy.toLowerCase() as InfoItemKind,
            }}
            label="Strategy"
          />
          <div>
            {strategy === "Canary" && (
              <React.Fragment>
                <InfoItemRow
                  items={{ content: currentStepIndex, icon: "fa-shoe-prints" }}
                  label="Step"
                />
                <InfoItemRow
                  items={{
                    content: `${
                      currentStep ? GetCurrentSetWeight(spec, status) : 100
                    }`,
                    icon: "fa-balance-scale-right",
                  }}
                  label="Set Weight"
                />
                <InfoItemRow
                  items={{ content: "0", icon: "fa-balance-scale" }}
                  label="Actual Weight"
                />{" "}
              </React.Fragment>
            )}
          </div>
        </Box>
        <Containers containers={spec?.template?.spec.containers} />
      </CenteredRow>

      <CenteredRow>
        {replicaSets && replicaSets.length > 0 && (
          <div
            className="argo-box"
            style={{ height: "max-content", width: "550px" }}
          >
            <BoxTitle>Revisions</BoxTitle>
            <div style={{ marginTop: "1em" }}>
              {revisions.map((r, i) => (
                <RevisionWidget key={i} revision={r} current={i === 0} />
              ))}
            </div>
          </div>
        )}
        {(strategy || "").toLowerCase() === "canary" &&
          spec.strategy.canary.steps &&
          spec.strategy.canary.steps.length > 0 && (
            <div className="argo-box steps" style={{ width: "250px" }}>
              <BoxTitle>Steps</BoxTitle>
              <div style={{ marginTop: "1em" }}>
                {(spec.strategy.canary.steps || []).map(
                  (step: any, i: number) => (
                    <Step
                      key={`step-${i}`}
                      step={step}
                      complete={i < currentStepIndex}
                      current={i === currentStepIndex}
                      last={i === (spec.strategy.canary.steps || []).length - 1}
                    />
                  )
                )}
              </div>
            </div>
          )}
      </CenteredRow>
    </div>
  );
};

export const component = Extension;
